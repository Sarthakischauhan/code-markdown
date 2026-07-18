import type { BuiltinThemeName, CodeTheme } from "../types";

export { catppuccinMocha, catppuccinMacchiato, catppuccinFrappe, catppuccinLatte, catppuccinThemes } from "./catppuccin";
export { anysphereTheme } from "./anysphere";

type ThemeLoader = () => Promise<CodeTheme>;

const themeLoaders: Record<BuiltinThemeName, ThemeLoader> = {
  "catppuccin-mocha": () => import("./catppuccin").then((module) => module.catppuccinMocha),
  "catppuccin-macchiato": () => import("./catppuccin").then((module) => module.catppuccinMacchiato),
  "catppuccin-frappe": () => import("./catppuccin").then((module) => module.catppuccinFrappe),
  "catppuccin-latte": () => import("./catppuccin").then((module) => module.catppuccinLatte),
  anysphere: () => import("./anysphere").then((module) => module.anysphereTheme),
};

const themeCache = new Map<BuiltinThemeName, Promise<CodeTheme>>();

export function isBuiltinTheme(value: CodeTheme | BuiltinThemeName | undefined): value is BuiltinThemeName {
  return typeof value === "string" && value in themeLoaders;
}

export function loadTheme(themeName: BuiltinThemeName = "catppuccin-mocha") {
  const cached = themeCache.get(themeName);
  if (cached) {
    return cached;
  }

  const promise = themeLoaders[themeName]();
  themeCache.set(themeName, promise);
  return promise;
}
