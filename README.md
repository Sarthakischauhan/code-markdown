# code-markdown

A React component for rendering beautiful, themeable code blocks with syntax highlighting, optional line numbers, line highlighting, and copy-to-clipboard.

## Features

- Syntax highlighting
- Multiple built-in themes
- Optional line numbers (`showLineNumbers` or `lineNumbers`)
- Line highlighting
- Copy button
- Custom font and styles

## Installation

```bash
bun add code-markdown
# or npm i code-markdown
# or pnpm add code-markdown
```

## Usage

```tsx
import { CodeMarkdown, catppuccinMocha } from "code-markdown";
import "code-markdown/styles.css";

export function App() {
  return (
    <CodeMarkdown
      theme={catppuccinMocha}
      language="tsx"
      showLineNumbers
      highlightLines={[2, 3]}
    >
      {`const hello = "world";`}
    </CodeMarkdown>
  );
}
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `string` | required | Code to render |
| `theme` | `CodeTheme` | `catppuccinMocha` | Theme object |
| `font` | `string` | `"JetBrains Mono", "Fira Code", monospace` | Font family |
| `language` | `string` | `typescript` | Language name |
| `showLineNumbers` | `boolean` | `false` | Show line numbers |
| `lineNumbers` | `boolean` | `false` | Alias for `showLineNumbers` |
| `showCopyButton` | `boolean` | `true` | Show copy button |
| `showLanguage` | `boolean` | `true` | Show language label |
| `highlightLines` | `number[]` | `[]` | Highlight specific lines |
| `className` | `string` | - | Extra class name |
| `style` | `React.CSSProperties` | - | Inline styles |

## Themes

Built-in themes are exported from the package:

- `catppuccinMocha`
- `catppuccinMacchiato`
- `catppuccinFrappe`
- `catppuccinLatte`
- `anysphereTheme` / `anySphereTheme`

## License

MIT
