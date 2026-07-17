import { cGrammar } from "./c";
import { cppGrammar } from "./cpp";
import { goGrammar } from "./go";
import { javascriptGrammar } from "./javascript";
import { pythonGrammar } from "./python";
import { rustGrammar } from "./rust";
import { typescriptGrammar } from "./typescript";
import type { LanguageGrammar } from "./types";

const fallbackGrammar = javascriptGrammar;
const grammarRegistry = new Map<string, LanguageGrammar>();

for (const grammar of [javascriptGrammar, typescriptGrammar, pythonGrammar, goGrammar, cGrammar, cppGrammar, rustGrammar]) {
  for (const name of grammar.names) {
    grammarRegistry.set(name, grammar);
  }
}

export function getGrammar(lang?: string): LanguageGrammar {
  if (!lang) {
    return fallbackGrammar;
  }

  return grammarRegistry.get(lang.toLowerCase()) ?? fallbackGrammar;
}

export { cGrammar, cppGrammar, goGrammar, javascriptGrammar, pythonGrammar, rustGrammar, typescriptGrammar };
export type { LanguageGrammar } from "./types";
