import { createHighlighter } from "shiki";

const THEMES = [
  "catppuccin-mocha",
  "catppuccin-macchiato",
  "catppuccin-frappe",
  "catppuccin-latte",
  "github-dark",
] as const;

const LANGS = [
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
] as const;

export type CodeHighlighter = Awaited<ReturnType<typeof createHighlighter>>;

let sharedHighlighter: CodeHighlighter | null = null;
let highlighterPromise: Promise<CodeHighlighter> | null = null;

export async function getCodeHighlighter() {
  if (sharedHighlighter) return sharedHighlighter;
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = createHighlighter({
    themes: [...THEMES],
    langs: [...LANGS],
  });

  sharedHighlighter = await highlighterPromise;
  return sharedHighlighter;
}

export function normalizeCode(value: string) {
  return value.replace(/^\n/, "").replace(/\n$/, "");
}
