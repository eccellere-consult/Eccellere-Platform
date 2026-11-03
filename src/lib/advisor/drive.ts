/**
 * Read-only Google Drive access with a service account (a robot login the owner creates once and shares the chosen folders with).
 * No extra packages: the sign-in token is made with Node's own crypto. Only folders shared with the robot can ever be read.
 *
 * Environment (Hostinger): GOOGLE_SERVICE_ACCOUNT_JSON = the whole key file contents, pasted as one value.
 */
import { createSign } from "node:crypto";

export interface DriveFile { id: string; name: string; mimeType: string; modifiedTime: string; md5?: string; size?: number }
export interface DriveClient {
  listFiles(folderIds: string[]): Promise<DriveFile[]>;
  readText(file: DriveFile): Promise<{ text: string } | { skipped: string }>;
}

interface Key { client_email: string; private_key: string }

export function serviceAccount(env: NodeJS.ProcessEnv = process.env): Key | null {
  const raw = (env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "").trim();
  if (!raw) return null;
  try {
    const k = JSON.parse(raw) as Partial<Key>;
    return k.client_email && k.private_key ? { client_email: k.client_email, private_key: k.private_key.replace(/\\n/g, "\n") } : null;
  } catch { return null; }
}

const b64 = (v: object | Buffer) => Buffer.from(Buffer.isBuffer(v) ? v : JSON.stringify(v)).toString("base64url");

let token: { value: string; exp: number } | null = null;
async function accessToken(key: Key): Promise<string> {
  if (token && token.exp > Date.now() + 60_000) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT" });
  const claim = b64({ iss: key.client_email, scope: "https://www.googleapis.com/auth/drive.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(key.private_key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64(sig)}` }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed (${res.status}). Check the service account key.`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return token.value;
}

const API = "https://www.googleapis.com/drive/v3";
const FOLDER = "application/vnd.google-apps.folder";
const GDOC = "application/vnd.google-apps.document";
const GSHEET = "application/vnd.google-apps.spreadsheet";
const GSLIDES = "application/vnd.google-apps.presentation";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const MAX_BYTES = 15 * 1024 * 1024;

/** What can be read today. PDFs and images are skipped with a reason until text extraction for them is added. */
export const READABLE = [GDOC, GSHEET, GSLIDES, DOCX, XLSX, PPTX, "text/plain", "text/markdown", "text/csv"];
export const supported = (mime: string) => READABLE.includes(mime);

export function driveClient(key: Key): DriveClient {
  const get = async (path: string, params: Record<string, string> = {}, raw = false) => {
    const url = `${API}${path}?${new URLSearchParams({ supportsAllDrives: "true", includeItemsFromAllDrives: "true", ...params })}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${await accessToken(key)}` } });
    if (!res.ok) throw new Error(`Google Drive said ${res.status} for ${path}.`);
    return raw ? Buffer.from(await res.arrayBuffer()) : res.json();
  };

  async function children(folderId: string): Promise<DriveFile[]> {
    const out: DriveFile[] = [];
    let pageToken = "";
    do {
      const j = await get("/files", { q: `'${folderId.replace(/'/g, "")}' in parents and trashed = false`, fields: "nextPageToken,files(id,name,mimeType,modifiedTime,md5Checksum,size)", pageSize: "200", ...(pageToken ? { pageToken } : {}) });
      for (const f of j.files ?? []) out.push({ id: f.id, name: f.name, mimeType: f.mimeType, modifiedTime: f.modifiedTime, md5: f.md5Checksum, size: f.size ? Number(f.size) : undefined });
      pageToken = j.nextPageToken ?? "";
    } while (pageToken);
    return out;
  }

  return {
    async listFiles(folderIds) {
      const files = new Map<string, DriveFile>();
      const seen = new Set<string>();
      const queue = [...folderIds];
      while (queue.length) {
        const id = queue.shift()!;
        if (seen.has(id)) continue;
        seen.add(id);
        for (const f of await children(id)) {
          if (f.mimeType === FOLDER) queue.push(f.id); else files.set(f.id, f);
        }
      }
      return [...files.values()];
    },

    async readText(f) {
      if (!supported(f.mimeType)) return { skipped: `This file type (${f.mimeType.split("/").pop()}) cannot be read yet.` };
      if ((f.size ?? 0) > MAX_BYTES) return { skipped: "The file is larger than 15 MB." };
      if (f.mimeType === GDOC || f.mimeType === GSLIDES) return { text: ((await get(`/files/${f.id}/export`, { mimeType: "text/plain" }, true)) as Buffer).toString("utf8") };
      if (f.mimeType === GSHEET) return { text: ((await get(`/files/${f.id}/export`, { mimeType: "text/csv" }, true)) as Buffer).toString("utf8") };
      const buf = (await get(`/files/${f.id}`, { alt: "media" }, true)) as Buffer;
      if (f.mimeType === DOCX) { const m = await import("mammoth"); return { text: (await m.extractRawText({ buffer: buf })).value }; }
      if (f.mimeType === XLSX) {
        const X = await import("xlsx-js-style");
        const wb = X.read(buf, { type: "buffer" });
        return { text: wb.SheetNames.map((n) => `${n}\n${X.utils.sheet_to_csv(wb.Sheets[n])}`).join("\n\n") };
      }
      if (f.mimeType === PPTX) {
        const { default: JSZip } = await import("jszip");
        const zip = await JSZip.loadAsync(buf);
        const slides = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
        const parts: string[] = [];
        for (const n of slides) parts.push((await zip.files[n].async("string")).replace(/<\/a:p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
        return { text: parts.join("\n\n") };
      }
      return { text: buf.toString("utf8") };
    },
  };
}
