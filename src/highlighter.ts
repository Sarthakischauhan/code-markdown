import { getGrammar } from "./grammars";
import type { LanguageGrammar, TokenMatch } from "./grammars/types";
import type { CodeTheme, TokenType } from "./types";

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
  type: TokenType;
  value: string;
};

type MiniHighlighter = {
  codeToHtml(code: string, options: CodeToHtmlOptions): string;
};

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

function isToken(token: Token | undefined, value: string) {
  return token?.value === value;
}

function previousNonText(tokens: Token[], index: number) {
  for (let cursor = index - 1; cursor >= 0; cursor--) {
    if (tokens[cursor].type !== "text") {
      return tokens[cursor];
    }
  }

  return undefined;
}

function nextNonText(tokens: Token[], index: number) {
  for (let cursor = index + 1; cursor < tokens.length; cursor++) {
    if (tokens[cursor].type !== "text") {
      return tokens[cursor];
    }
  }

  return undefined;
}

function refineTokens(tokens: Token[], grammar: LanguageGrammar): Token[] {
  const declarationKeywords = new Set(grammar.declarationKeywords ?? []);
  const typeKeywords = new Set(grammar.typeKeywords ?? []);

  return tokens.map((token, index) => {
    if (token.type !== "identifier") {
      return token;
    }

    const previous = previousNonText(tokens, index);
    const next = nextNonText(tokens, index);

    if (previous?.type === "keyword" && declarationKeywords.has(previous.value)) {
      return { ...token, type: "function" };
    }

    if (previous?.type === "keyword" && typeKeywords.has(previous.value)) {
      return { ...token, type: "type" };
    }

    if (isToken(next, "(")) {
      return { ...token, type: "function" };
    }

    if (isToken(next, ":")) {
      return { ...token, type: "property" };
    }

    if (isToken(previous, ":")) {
      return { ...token, type: "type" };
    }

    if (previous?.value === "(" || previous?.value === ",") {
      if (isToken(next, ":") || isToken(next, ",") || isToken(next, ")")) {
        return { ...token, type: "parameter" };
      }
    }

    return token;
  });
}

function matchComment(line: string, index: number, grammar: LanguageGrammar): TokenMatch | null {
  for (const prefix of grammar.commentPrefixes ?? []) {
    if (line.startsWith(prefix, index)) {
      return {
        token: { type: "comment", value: line.slice(index) },
        nextIndex: line.length,
      };
    }
  }

  return null;
}

function matchString(line: string, index: number, grammar: LanguageGrammar): TokenMatch | null {
  const quote = line[index] as '"' | "'" | "`";
  if (!(grammar.stringDelimiters ?? []).includes(quote)) {
    return null;
  }

  let cursor = index + 1;
  while (cursor < line.length) {
    if (line[cursor] === "\\") {
      cursor += 2;
      continue;
    }

    if (line[cursor] === quote) {
      cursor++;
      break;
    }

    cursor++;
  }

  return {
    token: { type: "string", value: line.slice(index, cursor) },
    nextIndex: cursor,
  };
}

function matchNumber(line: string, index: number, grammar: LanguageGrammar): TokenMatch | null {
  if (!/[0-9]/.test(line[index])) {
    return null;
  }

  let cursor = index;
  while (cursor < line.length && /[A-Za-z0-9._+-]/.test(line[cursor])) {
    cursor++;
  }

  const value = line.slice(index, cursor);
  if (!grammar.numberLiteral?.test(value)) {
    return null;
  }

  return {
    token: { type: "number", value },
    nextIndex: cursor,
  };
}

function matchIdentifier(line: string, index: number, grammar: LanguageGrammar): TokenMatch | null {
  const identifierStart = grammar.identifierStart ?? /[A-Za-z_$]/;
  const identifierPart = grammar.identifierPart ?? /[A-Za-z0-9_$]/;

  if (!identifierStart.test(line[index])) {
    return null;
  }

  let cursor = index + 1;
  while (cursor < line.length && identifierPart.test(line[cursor])) {
    cursor++;
  }

  const value = line.slice(index, cursor);
  const isKeyword = grammar.keywords.includes(value);

  return {
    token: { type: isKeyword ? "keyword" : "identifier", value },
    nextIndex: cursor,
  };
}

function matchPunctuation(line: string, index: number, grammar: LanguageGrammar): TokenMatch | null {
  if ((grammar.punctuation ?? []).includes(line[index])) {
    return {
      token: { type: "punctuation", value: line[index] },
      nextIndex: index + 1,
    };
  }

  return null;
}

function matchOperator(line: string, index: number, grammar: LanguageGrammar): TokenMatch | null {
  const operatorChars = grammar.operatorChars ?? /[=+\-*/%!?<>&|^~]/;
  if (!operatorChars.test(line[index])) {
    return null;
  }

  let cursor = index + 1;
  while (cursor < line.length && operatorChars.test(line[cursor])) {
    cursor++;
  }

  return {
    token: { type: "operator", value: line.slice(index, cursor) },
    nextIndex: cursor,
  };
}

function tokenizeLine(line: string, lang?: string): Token[] {
  const grammar = getGrammar(lang);
  const tokens: Token[] = [];
  let index = 0;

  while (index < line.length) {
    if (/\s/.test(line[index])) {
      const start = index;
      while (index < line.length && /\s/.test(line[index])) {
        index++;
      }
      tokens.push({ type: "text", value: line.slice(start, index) });
      continue;
    }

    const match =
      matchComment(line, index, grammar) ??
      matchString(line, index, grammar) ??
      matchNumber(line, index, grammar) ??
      matchIdentifier(line, index, grammar) ??
      matchPunctuation(line, index, grammar) ??
      matchOperator(line, index, grammar);

    if (match) {
      tokens.push(match.token);
      index = match.nextIndex;
      continue;
    }

    tokens.push({ type: "text", value: line[index] });
    index++;
  }

  return refineTokens(tokens, grammar);
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
    case "function":
      return theme.colors.function;
    case "property":
      return theme.colors.attribute;
    case "type":
      return theme.colors.type;
    case "parameter":
      return theme.colors.variable;
    case "identifier":
      return theme.colors.foreground;
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
