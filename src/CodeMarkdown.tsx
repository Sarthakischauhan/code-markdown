import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { CodeTheme, CodeMarkdownProps } from "./types";
import { isBuiltinTheme, loadTheme } from "./themes";
import { CodeHeader } from "./components/CodeHeader";
import { CodeBody } from "./components/CodeBody";
import { CodeLoading } from "./components/CodeLoading";
import { getCodeHighlighter, normalizeCode } from "./highlighter";

export function CodeMarkdown({
  children,
  theme = "catppuccin-mocha",
  font = '"JetBrains Mono", "Fira Code", monospace',
  language = "typescript",
  showLineNumbers,
  lineNumbers,
  showCopyButton = true,
  showLanguage = true,
  className,
  style,
  highlightLines = [],
}: CodeMarkdownProps) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<CodeTheme | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    "--code-bg": resolvedTheme?.colors.background,
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

  return (
    <div className={`code-markdown ${className || ""}`} style={containerStyle}>
      <CodeHeader
        language={language}
        copied={copied}
        showLanguage={showLanguage}
        showCopyButton={showCopyButton}
        onCopy={handleCopy}
      />

      <CodeBody
        html={html}
        showLineNumbers={shouldShowLineNumbers}
      />
    </div>
  );
}
