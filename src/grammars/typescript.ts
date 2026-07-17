import type { LanguageGrammar } from "./types";
import { javascriptGrammar } from "./javascript";

export const typescriptGrammar: LanguageGrammar = {
  ...javascriptGrammar,
  names: ["typescript", "ts", "tsx"],
  typeKeywords: ["class", "extends", "implements", "interface", "type", "enum"],
};
