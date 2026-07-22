export interface CodeTheme {
  name: string;
  shikiTheme: string;
  colors: {
    background: string;
    foreground: string;
    comment: string;
    keyword: string;
    string: string;
    function: string;
    variable: string;
    number: string;
    operator: string;
    punctuation: string;
    type: string;
    tag: string;
    attribute: string;
    constant: string;
    surface: string;
    overlay: string;
    subtext: string;
  };
}

export type BuiltinThemeName =
  | "catppuccin-mocha"
  | "catppuccin-macchiato"
  | "catppuccin-frappe"
  | "catppuccin-latte"
  | "anysphere";

/** Languages and aliases supported by the built-in grammars. */
export type SupportedLanguage =
  | "c"
  | "h"
  | "cpp"
  | "cxx"
  | "cc"
  | "hpp"
  | "hxx"
  | "go"
  | "javascript"
  | "js"
  | "jsx"
  | "mjs"
  | "python"
  | "py"
  | "rust"
  | "rs"
  | "typescript"
  | "ts"
  | "tsx";

export type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "punctuation"
  | "operator"
  | "identifier"
  | "function"
  | "property"
  | "type"
  | "parameter"
  | "text";

export interface CodeMarkdownProps {
  children: string;
  theme?: CodeTheme | BuiltinThemeName;
  font?: string;
  language?: SupportedLanguage;
  showLineNumbers?: boolean;
  lineNumbers?: boolean;
  showCopyButton?: boolean;
  showExportButtons?: boolean;
  showLanguage?: boolean;
  exportFileName?: string;
  className?: string;
  style?: React.CSSProperties;
  highlightLines?: number[];
}
