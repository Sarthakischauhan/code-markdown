import type { LanguageGrammar } from "./types";

type GrammarModule = {
  cGrammar?: LanguageGrammar;
  cppGrammar?: LanguageGrammar;
  goGrammar?: LanguageGrammar;
  javascriptGrammar?: LanguageGrammar;
  pythonGrammar?: LanguageGrammar;
  rustGrammar?: LanguageGrammar;
  typescriptGrammar?: LanguageGrammar;
};

type GrammarLoader = () => Promise<GrammarModule>;

const fallbackLanguage = "javascript";

const grammarLoaders: Record<string, GrammarLoader> = {
  c: () => import("./c"),
  h: () => import("./c"),
  cpp: () => import("./cpp"),
  cxx: () => import("./cpp"),
  cc: () => import("./cpp"),
  hpp: () => import("./cpp"),
  hxx: () => import("./cpp"),
  go: () => import("./go"),
  javascript: () => import("./javascript"),
  js: () => import("./javascript"),
  jsx: () => import("./javascript"),
  mjs: () => import("./javascript"),
  python: () => import("./python"),
  py: () => import("./python"),
  rust: () => import("./rust"),
  rs: () => import("./rust"),
  typescript: () => import("./typescript"),
  ts: () => import("./typescript"),
  tsx: () => import("./typescript"),
};

const grammarExportNames: Record<string, keyof GrammarModule> = {
  c: "cGrammar",
  h: "cGrammar",
  cpp: "cppGrammar",
  cxx: "cppGrammar",
  cc: "cppGrammar",
  hpp: "cppGrammar",
  hxx: "cppGrammar",
  go: "goGrammar",
  javascript: "javascriptGrammar",
  js: "javascriptGrammar",
  jsx: "javascriptGrammar",
  mjs: "javascriptGrammar",
  python: "pythonGrammar",
  py: "pythonGrammar",
  rust: "rustGrammar",
  rs: "rustGrammar",
  typescript: "typescriptGrammar",
  ts: "typescriptGrammar",
  tsx: "typescriptGrammar",
};

const grammarCache = new Map<string, Promise<LanguageGrammar>>();

function normalizeLanguage(lang?: string) {
  return lang?.toLowerCase() ?? fallbackLanguage;
}

export async function loadGrammar(lang?: string): Promise<LanguageGrammar> {
  const language = normalizeLanguage(lang);
  const loader = grammarLoaders[language] ?? grammarLoaders[fallbackLanguage];
  const exportName = grammarExportNames[language] ?? grammarExportNames[fallbackLanguage];
  const cacheKey = grammarLoaders[language] ? language : fallbackLanguage;
  const cached = grammarCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const promise = loader().then((module) => {
    const grammar = module[exportName];
    if (!grammar) {
      throw new Error(`Grammar module for "${cacheKey}" did not export "${String(exportName)}".`);
    }

    return grammar;
  });

  grammarCache.set(cacheKey, promise);
  return promise;
}

export type { LanguageGrammar } from "./types";
