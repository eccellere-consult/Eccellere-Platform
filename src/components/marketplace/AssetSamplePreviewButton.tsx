"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { X, Eye } from "lucide-react";

interface Props {
  slug: string;
  title: string;
  /** Maximum number of pages shown. Server already serves a truncated copy. */
  maxPages?: number;
  buttonClassName?: string;
}

declare global {
  interface Window {
    docx?: {
      renderAsync: (
        data: Blob,
        container: HTMLElement,
        styleContainer?: HTMLElement | null,
        options?: Record<string, unknown>
      ) => Promise<void>;
    };
    JSZip?: unknown;
  }
}

/**
 * "Preview Sample" button on the marketplace slug page. On click opens a
 * fullscreen modal that loads `docx-preview` + `jszip` from the jsDelivr
 * CDN, fetches the server-truncated 5-page DOCX from
 * `/api/marketplace/preview-file/<slug>`, and renders it preserving Word
 * formatting (fonts, tables, images, page layout).
 */
export function AssetSamplePreviewButton({
  slug,
  title,
  maxPages = 5,
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [scriptsReady, setScriptsReady] = useState({ jszip: false, docx: false });
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "unavailable">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while the modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Render once the modal opens AND both scripts are loaded
  useEffect(() => {
    if (!open) return;
    if (!scriptsReady.jszip || !scriptsReady.docx) return;
    if (!containerRef.current) return;

    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const resp = await fetch(`/api/marketplace/preview-file/${slug}`, {
          cache: "force-cache",
        });
        if (resp.status === 404 || resp.status === 415) {
          if (!cancelled) setStatus("unavailable");
          return;
        }
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        if (cancelled || !containerRef.current) return;
        if (!window.docx?.renderAsync) {
          throw new Error("Viewer library not loaded");
        }
        // Clear previous render
        containerRef.current.innerHTML = "";
        await window.docx.renderAsync(blob, containerRef.current, null, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: false,
        });
        if (cancelled) return;
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Failed to load preview");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, slug, scriptsReady]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          "inline-flex items-center gap-2 rounded-md border border-eccellere-ink/15 bg-white px-4 py-2.5 text-sm font-medium text-eccellere-ink transition-colors hover:border-eccellere-gold hover:text-eccellere-gold"
        }
      >
        <Eye className="h-4 w-4" />
        Preview sample ({maxPages} pages)
      </button>

      {open && (
        <>
          <Script
            src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"
            strategy="afterInteractive"
            onLoad={() => setScriptsReady((s) => ({ ...s, jszip: true }))}
          />
          <Script
            src="https://cdn.jsdelivr.net/npm/docx-preview@0.3.6/dist/docx-preview.min.js"
            strategy="afterInteractive"
            onLoad={() => setScriptsReady((s) => ({ ...s, docx: true }))}
          />

          <div
            className="fixed inset-0 z-[100] flex flex-col bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Document sample preview"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#1f3864] px-5 py-3 text-white">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-medium">{title}</h2>
                <p className="text-xs text-white/60">
                  Sample preview — first {maxPages} pages
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close preview"
                className="rounded p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto bg-[#f3f4f6]">
              {status === "loading" && (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-ink-light">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-eccellere-ink/15 border-t-eccellere-gold" />
                  Loading sample preview…
                </div>
              )}

              {status === "unavailable" && (
                <div className="mx-auto mt-24 max-w-md rounded-md border border-eccellere-ink/10 bg-white p-6 text-center text-sm text-ink-mid">
                  Sample preview is not available for this asset format.
                </div>
              )}

              {status === "error" && (
                <div className="mx-auto mt-24 max-w-md rounded-md border border-red-200 bg-white p-6 text-center text-sm text-red-700">
                  Could not load preview ({errorMsg}).
                </div>
              )}

              <div
                ref={containerRef}
                className={`docx-preview-modal mx-auto max-w-[1000px] px-4 pb-8 pt-6 ${
                  status === "ready" ? "block" : "hidden"
                }`}
              />

              {status === "ready" && (
                <div className="mx-auto mb-8 max-w-[1000px] rounded-md border border-eccellere-gold/40 bg-eccellere-cream/60 px-6 py-5 text-center">
                  <p className="text-sm font-medium text-eccellere-ink">
                    End of preview — only the first {maxPages} pages are shown
                  </p>
                  <p className="mt-1 text-xs text-ink-light">
                    Purchase to download the complete document.
                  </p>
                </div>
              )}
            </div>
          </div>

          <style jsx global>{`
            .docx-preview-modal .docx-wrapper {
              background: transparent !important;
              padding: 0 !important;
            }
            .docx-preview-modal .docx-wrapper > section.docx {
              margin: 0 auto 16px auto !important;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08),
                0 8px 24px rgba(0, 0, 0, 0.06) !important;
              background: #fff !important;
            }
          `}</style>
        </>
      )}
    </>
  );
}
