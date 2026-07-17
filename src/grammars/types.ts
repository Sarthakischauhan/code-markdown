import type { TokenType } from "../types";

export type StringDelimiter = "'" | '"' | "`";

export interface LanguageGrammar {
  names: string[];
  keywords: readonly string[];
  commentPrefixes?: readonly string[];
  stringDelimiters?: readonly StringDelimiter[];
  identifierStart?: RegExp;
  identifierPart?: RegExp;
  numberLiteral?: RegExp;
  punctuation?: readonly string[];
  operatorChars?: RegExp;
}

export interface TokenMatch {
  token: {
    type: TokenType;
    value: string;
  };
  nextIndex: number;
}
