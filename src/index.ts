export { CodeMarkdown } from "./CodeMarkdown";
export { getCodeHighlighter, normalizeCode } from "./highlighter";
export type { BuiltinThemeName, CodeTheme, CodeMarkdownProps } from "./types";
export {
  catppuccinMocha,
  catppuccinMacchiato,
  catppuccinFrappe,
  catppuccinLatte,
  catppuccinThemes,
} from "./themes/catppuccin";
export { anysphereTheme, anysphereTheme as anySphereTheme } from "./themes/anysphere";
export { isBuiltinTheme, loadTheme } from "./themes";
