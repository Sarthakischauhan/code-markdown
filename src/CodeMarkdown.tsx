import { useState, useEffect, useCallback, useRef } from "react";
import { createHighlighter } from "shiki";
import type { CodeTheme, CodeMarkdownProps } from "./types";
import { catppuccinMocha } from "./themes/catppuccin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedHighlighter: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let highlighterPromise: Promise<any> | null = null;

async function getHighlighter() {
  if (sharedHighlighter) return sharedHighlighter;
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = createHighlighter({
    themes: [
      "catppuccin-mocha",
      "catppuccin-macchiato",
      "catppuccin-frappe",
      "catppuccin-latte",
    ],
    langs: [
      "javascript",
      "typescript",
      "jsx",
      "tsx",
      "html",
      "css",
      "json",
      "python",
      "rust",
      "go",
      "bash",
      "sql",
      "yaml",
      "markdown",
      "c",
      "cpp",
      "java",
      "ruby",
      "php",
      "swift",
      "kotlin",
      "toml",
      "dockerfile",
    ],
  });

  sharedHighlighter = await highlighterPromise;
  return sharedHighlighter;
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

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

  const loadHighlighter = useCallback(async () => {
    try {
      const highlighter = await getHighlighter();
      const code = children.trim();

      const output = highlighter.codeToHtml(code, {
        lang: language,
        theme: theme.shikiTheme,
        transformers: [
          {
            line(node: any, line: number) {
              node.properties["data-line"] = line;
              if (highlightLines.includes(line)) {
                node.properties["class"] =
                  (node.properties["class"] || "") + " highlighted";
              }
            },
          },
        ],
      });

      setHtml(output);
    } catch (err) {
      console.error("Failed to highlight code:", err);
      setHtml(
        `<pre><code>${children
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</code></pre>`
      );
    } finally {
      setIsLoading(false);
    }
  }, [children, language, theme, highlightLines]);

  useEffect(() => {
    loadHighlighter();
  }, [loadHighlighter]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children.trim());
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = children.trim();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [children]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const lines = children.trim().split("\n");

  const containerStyle: React.CSSProperties = {
    "--code-bg": theme.colors.background,
    "--code-fg": theme.colors.foreground,
    "--code-font": font,
    "--code-surface": theme.colors.surface,
    "--code-overlay": theme.colors.overlay,
    "--code-subtext": theme.colors.subtext,
    "--code-comment": theme.colors.comment,
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    ...style,
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div
        className={`code-markdown code-markdown--loading ${className || ""}`}
        style={containerStyle}
      >
        <div className="code-markdown__loading">
          <div className="code-markdown__loading-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`code-markdown ${className || ""}`}
      style={containerStyle}
    >
      <div className="code-markdown__header">
        {showLanguage && (
          <span className="code-markdown__language">{language}</span>
        )}
        {showCopyButton && (
          <button
            className="code-markdown__copy"
            onClick={handleCopy}
            aria-label={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        )}
      </div>

      <div className="code-markdown__body">
        {showLineNumbers && (
          <div className="code-markdown__line-numbers">
            {lines.map((_, i) => (
              <span
                key={i}
                className={`code-markdown__line-number ${
                  highlightLines.includes(i + 1) ? "highlighted" : ""
                }`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        )}
        <div
          className="code-markdown__code"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
