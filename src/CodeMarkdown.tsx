import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toCanvas } from "html-to-image";
import type { CodeTheme, CodeMarkdownProps } from "./types";
import { isBuiltinTheme, loadTheme } from "./themes";
import { CodeHeader } from "./components/CodeHeader";
import { CodeBody } from "./components/CodeBody";
import { CodeLoading } from "./components/CodeLoading";
import { getCodeHighlighter, normalizeCode } from "./highlighter";
import { buildExportCanvas, invertHex } from "./lib/exportImage";

export function CodeMarkdown({
  children,
  theme = "catppuccin-mocha",
  font = '"JetBrains Mono", "Fira Code", monospace',
  language = "typescript",
  showLineNumbers,
  lineNumbers,
  showCopyButton = true,
  showExportButtons = false,
  showLanguage = true,
  exportFileName = "code-snippet",
  className,
  style,
  highlightLines = [],
}: CodeMarkdownProps) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<CodeTheme | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const code = normalizeCode(children);
  const shouldShowLineNumbers = showLineNumbers ?? lineNumbers ?? false;
  // Consumers commonly pass an inline array. Use its contents as the dependency
  // so that an equivalent array does not trigger another async highlight run.
  const highlightLinesKey = highlightLines.join(",");
  const stableHighlightLines = useMemo(
    () => [...highlightLines],
    [highlightLinesKey]
  );

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);

    (async () => {
      try {
        const resolvedTheme: CodeTheme = isBuiltinTheme(theme) ? await loadTheme(theme) : theme;
        const highlighter = await getCodeHighlighter();

        const output = await highlighter.codeToHtml(code, {
          lang: language,
          theme: resolvedTheme,
          highlightLines: stableHighlightLines,
          showLineNumbers: shouldShowLineNumbers,
        });

        if (cancelled) return;
        setResolvedTheme(resolvedTheme);
        setHtml(output);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to highlight code:", err);
        setResolvedTheme(null);
        setHtml(
          `<pre><code>${code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</code></pre>`
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, language, theme, highlightLinesKey, shouldShowLineNumbers, stableHighlightLines]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const handleExport = useCallback(
    async (format: "png" | "jpg") => {
      const node = containerRef.current;
      if (!node || isExporting) return;

      setIsExporting(true);

      try {
        const backgroundColor = resolvedTheme?.colors.background ?? "#1e1e2e";
        const invertedBackground = invertHex(backgroundColor);
        const pixelRatio = 2;

        const snippetCanvas = await toCanvas(node, {
          cacheBust: true,
          pixelRatio,
          skipFonts: true,
          filter: (domNode: HTMLElement) =>
            !("getAttribute" in domNode) || domNode.getAttribute("data-export-ignore") !== "true",
        });
        const exportCanvas = buildExportCanvas(
          snippetCanvas,
          invertedBackground,
          pixelRatio
        );
        const link = document.createElement("a");
        const dataUrl =
          format === "png"
            ? exportCanvas.toDataURL("image/png")
            : exportCanvas.toDataURL("image/jpeg", 0.95);

        link.download = `${exportFileName}.${format}`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error(`Failed to export ${format.toUpperCase()}:`, err);
      } finally {
        setIsExporting(false);
      }
    },
    [exportFileName, isExporting, resolvedTheme]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const backgroundColor = resolvedTheme?.colors.background ?? "#1e1e2e";

  const containerStyle: React.CSSProperties = {
    "--code-bg": backgroundColor,
    "--code-fg": resolvedTheme?.colors.foreground,
    "--code-font": font,
    "--code-surface": resolvedTheme?.colors.surface,
    "--code-overlay": resolvedTheme?.colors.overlay,
    "--code-subtext": resolvedTheme?.colors.subtext,
    "--code-comment": resolvedTheme?.colors.comment,
    position: "relative",
    borderRadius: "5px",
    overflow: "hidden",
    ...style,
  } as React.CSSProperties;

  if (isLoading && !html) {
    return (
      <div
        className={`code-markdown code-markdown--loading ${className || ""}`}
        style={containerStyle}
      >
        <CodeLoading />
      </div>
    );
  }

  const hasHeaderControls = showLanguage || showCopyButton || showExportButtons;
  const rootClassName = [
    "code-markdown",
    hasHeaderControls ? "code-markdown--with-controls" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={containerRef} className={rootClassName} style={containerStyle}>
      <CodeHeader
        language={language}
        copied={copied}
        showLanguage={showLanguage}
        showCopyButton={showCopyButton}
        showExportButtons={showExportButtons}
        isExporting={isExporting}
        onCopy={handleCopy}
        onExport={handleExport}
      />

      <CodeBody
        html={html}
        showLineNumbers={shouldShowLineNumbers}
      />
    </div>
  );
}
