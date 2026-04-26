"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface Props {
  slug: string;
  /** Maximum number of pages to show before fading out. */
  maxPages?: number;
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
 * Marketplace asset DOCX preview — fetches the file from the public preview
 * endpoint and renders it in the browser using docx-preview. After render,
 * keeps only the first `maxPages` page sections and overlays a "preview ends
 * here" banner so visitors see a faithful sample without the full document.
 */
export function AssetDocPreview({ slug, maxPages = 5 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "unavailable">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [scriptsReady, setScriptsReady] = useState({ jszip: false, docx: false });

  useEffect(() => {
    if (!scriptsReady.jszip || !scriptsReady.docx) return;
    if (!containerRef.current) return;

    let cancelled = false;
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
        await window.docx.renderAsync(blob, containerRef.current, null, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: false,
          renderFooters: false,
          renderFootnotes: false,
        });
        if (cancelled || !containerRef.current) return;

        // After render, docx-preview produces one <section class="docx"> per
        // logical page. Hide everything past `maxPages`.
        const pages = containerRef.current.querySelectorAll(
          ".docx-wrapper > section.docx"
        );
        let visible = 0;
        pages.forEach((node) => {
          visible += 1;
          if (visible > maxPages) {
            (node as HTMLElement).style.display = "none";
          }
        });
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
  }, [slug, maxPages, scriptsReady]);

  return (
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

      <div className="overflow-hidden rounded-md border border-eccellere-ink/10 bg-[#f3f4f6]">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-ink-light">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-eccellere-ink/15 border-t-eccellere-gold" />
            Loading sample preview…
          </div>
        )}

        {status === "unavailable" && (
          <div className="px-6 py-12 text-center text-sm text-ink-light">
            Sample preview is not available for this asset format.
          </div>
        )}

        {status === "error" && (
          <div className="px-6 py-12 text-center text-sm text-red-600">
            Could not load preview ({errorMsg}).
          </div>
        )}

        <div
          ref={containerRef}
          className={`docx-preview-wrap relative ${status === "ready" ? "block" : "hidden"}`}
        />

        {status === "ready" && (
          <div className="border-t border-eccellere-ink/10 bg-white px-6 py-5 text-center">
            <p className="text-sm font-medium text-eccellere-ink">
              Preview limited to first {maxPages} pages
            </p>
            <p className="mt-1 text-xs text-ink-light">
              Purchase to access the complete document.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .docx-preview-wrap .docx-wrapper {
          background: transparent !important;
          padding: 16px 0 !important;
        }
        .docx-preview-wrap .docx-wrapper > section.docx {
          margin: 0 auto 16px auto !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04) !important;
          background: #fff !important;
        }
      `}</style>
    </>
  );
}
