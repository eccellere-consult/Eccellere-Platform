/**
 * Reads a fetch Response as JSON without throwing on an empty or non-JSON body
 * (for example a proxy error page or an empty 5xx). Always returns an object;
 * when the request failed and gave no message, an `error` text is supplied.
 */
// Loosely typed on purpose: callers read fields from many different API replies.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = Record<string, any>;

export async function readJson(r: Response): Promise<Json> {
  let data: Json = {};
  try {
    const text = await r.text();
    if (text) data = JSON.parse(text);
  } catch {
    data = {};
  }
  if (!r.ok && !data.error) {
    data.error =
      r.status === 401
        ? "Please sign in to continue."
        : r.status === 504 || r.status === 502
          ? "The server took too long to respond. Please try again."
          : `The server returned an error (code ${r.status}). Please try again, and tell the administrator if it continues.`;
  }
  return data;
}
