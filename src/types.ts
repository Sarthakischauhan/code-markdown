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

export interface CodeMarkdownProps {
  children: string;
  theme?: CodeTheme;
  font?: string;
  language?: string;
  showLineNumbers?: boolean;
  lineNumbers?: boolean;
  showCopyButton?: boolean;
  showLanguage?: boolean;
  className?: string;
  style?: React.CSSProperties;
  highlightLines?: number[];
}
