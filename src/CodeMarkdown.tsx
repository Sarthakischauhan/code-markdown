import { useState, useEffect, useCallback, useRef } from "react";
import type { CodeTheme, CodeMarkdownProps } from "./types";
import { catppuccinMocha } from "./themes/catppuccin";
import { CodeHeader } from "./components/CodeHeader";
import { CodeBody } from "./components/CodeBody";
import { CodeLoading } from "./components/CodeLoading";
import { getCodeHighlighter, normalizeCode } from "./highlighter";

export function CodeMarkdown({
  children,
  theme = catppuccinMocha,
  font = '"JetBrains Mono", "Fira Code", monospace',
  language = "typescript",
  showLineNumbers = false,
  showCopyButton = true,
  showLanguage = true,
  className,
  style,
  highlightLines = [],
}: CodeMarkdownProps) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const code = normalizeCode(children);
  const lines = code.split(/\r?\n/);

  const loadHighlighter = useCallback(async () => {
    try {
      const highlighter = await getCodeHighlighter();

      const output = highlighter.codeToHtml(code, {
        lang: language,
        theme,
        highlightLines,
      });

      setHtml(output);
    } catch (err) {
      console.error("Failed to highlight code:", err);
      setHtml(
        `<pre><code>${code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</code></pre>`
      );
    } finally {
      setIsLoading(false);
    }
  }, [code, language, theme, highlightLines]);

  useEffect(() => {
    loadHighlighter();
  }, [loadHighlighter]);

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
    "--code-bg": theme.colors.background,
    "--code-fg": theme.colors.foreground,
    "--code-font": font,
    "--code-surface": theme.colors.surface,
    "--code-overlay": theme.colors.overlay,
    "--code-subtext": theme.colors.subtext,
    "--code-comment": theme.colors.comment,
    position: "relative",
    borderRadius: "5px",
    overflow: "hidden",
    ...style,
  } as React.CSSProperties;

  if (isLoading) {
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
        lines={lines}
        showLineNumbers={showLineNumbers}
        highlightLines={highlightLines}
      />
    </div>
  );
}
