import type { CodeTheme } from "./types";

type HighlightLine = {
  line(node: { properties: Record<string, string> }, line: number): void;
};

type CodeToHtmlOptions = {
  lang?: string;
  theme: CodeTheme;
  highlightLines?: number[];
  transformers?: HighlightLine[];
};

type Token = {
  type: "keyword" | "string" | "comment" | "number" | "punctuation" | "operator" | "text";
  value: string;
};

type MiniHighlighter = {
  codeToHtml(code: string, options: CodeToHtmlOptions): string;
};

const JS_KEYWORDS = new Set([
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "async",
  "from",
  "as",
]);

const JSON_KEYWORDS = new Set(["true", "false", "null"]);
const BASH_KEYWORDS = new Set(["if", "then", "else", "elif", "fi", "for", "in", "do", "done", "case", "esac", "function", "local", "export"]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeCode(value: string) {
  return value.replace(/^\n/, "").replace(/\n$/, "");
}

function keywordsFor(lang?: string) {
  switch (lang) {
    case "json":
      return JSON_KEYWORDS;
    case "bash":
    case "shell":
      return BASH_KEYWORDS;
    default:
      return JS_KEYWORDS;
  }
}

function tokenizeLine(line: string, lang?: string): Token[] {
  const keywords = keywordsFor(lang);
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const next = line[i + 1];

    if (/\s/.test(char)) {
      let start = i;
      while (i < line.length && /\s/.test(line[i])) i++;
      tokens.push({ type: "text", value: line.slice(start, i) });
      continue;
    }

    if (char === "/" && next === "/") {
      tokens.push({ type: "comment", value: line.slice(i) });
      break;
    }

    if (char === "#" && (lang === "bash" || lang === "shell" || lang === "yaml")) {
      tokens.push({ type: "comment", value: line.slice(i) });
      break;
    }

    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      let start = i++;
      while (i < line.length) {
        if (line[i] === "\\") {
          i += 2;
          continue;
        }
        if (line[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: "string", value: line.slice(start, i) });
      continue;
    }

    if (/[0-9]/.test(char)) {
      let start = i;
      while (i < line.length && /[0-9A-Za-z_.xob]/.test(line[i])) i++;
      tokens.push({ type: "number", value: line.slice(start, i) });
      continue;
    }

    if (/[A-Za-z_$]/.test(char)) {
      let start = i;
      while (i < line.length && /[A-Za-z0-9_$]/.test(line[i])) i++;
      const value = line.slice(start, i);
      tokens.push({ type: keywords.has(value) ? "keyword" : "text", value });
      continue;
    }

    if (/[{}()[\],.;:]/.test(char)) {
      tokens.push({ type: "punctuation", value: char });
      i++;
      continue;
    }

    if (/[=+\-*/%!?<>&|^~]/.test(char)) {
      let start = i;
      while (i < line.length && /[=+\-*/%!?<>&|^~]/.test(line[i])) i++;
      tokens.push({ type: "operator", value: line.slice(start, i) });
      continue;
    }

    tokens.push({ type: "text", value: char });
    i++;
  }

  return tokens;
}

function tokenColor(type: Token["type"], theme: CodeTheme) {
  switch (type) {
    case "keyword":
      return theme.colors.keyword;
    case "string":
      return theme.colors.string;
    case "comment":
      return theme.colors.comment;
    case "number":
      return theme.colors.number;
    case "punctuation":
      return theme.colors.punctuation;
    case "operator":
      return theme.colors.operator;
    default:
      return theme.colors.foreground;
  }
}

function renderToken(token: Token, theme: CodeTheme) {
  const color = tokenColor(token.type, theme);
  return `<span class="cm-token cm-${token.type}" style="color:${color}">${escapeHtml(token.value)}</span>`;
}

function renderLine(line: string, lineNumber: number, lang: string | undefined, theme: CodeTheme, highlightLines: number[]) {
  const tokens = tokenizeLine(line, lang);
  const highlighted = highlightLines.includes(lineNumber) ? " highlighted" : "";
  return `<span data-line="${lineNumber}" class="cm-line${highlighted}">${tokens
    .map((token) => renderToken(token, theme))
    .join("")}</span>`;
}

let sharedHighlighter: MiniHighlighter | null = null;
let highlighterPromise: Promise<MiniHighlighter> | null = null;

export async function getCodeHighlighter() {
  if (sharedHighlighter) return sharedHighlighter;
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = Promise.resolve({
    codeToHtml(code: string, options: CodeToHtmlOptions) {
      const normalized = normalizeCode(code);
      const lines = normalized.split(/\r?\n/);
      const highlightLines = options.highlightLines ?? [];
      const html = lines
        .map((line, index) => renderLine(line, index + 1, options.lang, options.theme, highlightLines))
        .join("\n");

      return `<pre><code>${html}</code></pre>`;
    },
  });

  sharedHighlighter = await highlighterPromise;
  return sharedHighlighter;
}

export { normalizeCode };
