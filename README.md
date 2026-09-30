<div align="center">

<img width="600" alt="code-snippet" src="https://github.com/user-attachments/assets/1cb43d38-7615-47df-8e68-9ec999f70fe5"/>

</div>

# code-markdown
A React component for rendering themeable code blocks with syntax highlighting, optional line numbers, line highlighting, and copy-to-clipboard.

## Features

- Syntax highlighting
- Multiple built-in themes
- Optional line numbers (`showLineNumbers` or `lineNumbers`)
- Line highlighting
- Copy button
- Local SVG rendering for Mermaid flowcharts, with a diagram/source switch
- Optional PNG/JPG export
- Custom font and styles
- Grammar-driven tokenizer registry for custom language support

## Installation

Install the package with your package manager:

```bash
bun add @sarchauhan/code-markdown
```

```bash
npm install @sarchauhan/code-markdown
```

```bash
pnpm add @sarchauhan/code-markdown
```

Import the component and stylesheet once in your app:

```tsx
import { CodeMarkdown } from "@sarchauhan/code-markdown";
import "@sarchauhan/code-markdown/styles.css";
```

## Usage

```tsx
import { CodeMarkdown } from "@sarchauhan/code-markdown";
import "@sarchauhan/code-markdown/styles.css";

export function App() {
  return (
    <CodeMarkdown
      theme="catppuccin-mocha"
      language="tsx"
      showLineNumbers
      showExportButtons
      highlightLines={[2, 3]}
    >
      {`const hello = "world";`}
    </CodeMarkdown>
  );
}
```

## Examples

### Python

```tsx
<CodeMarkdown language="python">
  {`def greet(name):
    return f"hello, {name}"

print(greet("Ada"))`}
</CodeMarkdown>
```

### Go

```tsx
<CodeMarkdown language="go">
  {`package main

import "fmt"

func main() {
    fmt.Println("hello, go")
}`}
</CodeMarkdown>
```

### Rust

```tsx
<CodeMarkdown language="rust">
  {`fn main() {
    let name = "Ferris";
    println!("hello, {name}");
}`}
</CodeMarkdown>
```

### C++

```tsx
<CodeMarkdown language="cpp">
  {`#include <iostream>

int main() {
    std::cout << "hello, c++\\n";
    return 0;
}`}
</CodeMarkdown>
```

## Mermaid flowcharts

Set `language="mermaid"` to draw a flowchart directly inside the code block:

```tsx
<CodeMarkdown language="mermaid">
  {`flowchart LR
    A[Write code] --> B{Tests pass?}
    B -->|yes| C[Ship]
    B -.->|no| A`}
</CodeMarkdown>
```

Rendering uses local React SVG with no Mermaid dependency, CDN, or remote diagram service. Supported syntax: `flowchart` / `graph` with `TB`, `TD`, `BT`, `LR`, or `RL` directions; node labels in `[]`, `()`, and `{}`; and `-->`, `---`, `-.->`, and `==>` links with optional `|label|`. Chained links such as `A --> B --> C`, cycles, and self-loops are supported. Node labels wrap instead of being truncated. Use the Code button to view or copy the source. Unsupported Mermaid syntax is shown as code instead of displaying a misleading diagram.

## Grammars

Language definitions live under `src/grammars`. The tokenizer stays unified in `src/highlighter.ts`, and each grammar file only declares language rules:

- aliases / language names
- keywords
- comment prefixes
- string delimiters
- identifier and number patterns
- punctuation and operator rules

Add a new grammar file and register it in `src/grammars/index.ts`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `string` | required | Code to render |
| `theme` | `CodeTheme \| BuiltinThemeName` | `"catppuccin-mocha"` | Theme object or built-in theme name |
| `font` | `string` | `"JetBrains Mono", "Fira Code", monospace` | Font family |
| `language` | `SupportedLanguage` | `typescript` | Language name or alias, including `mermaid` |
| `showLineNumbers` | `boolean` | `false` | Show line numbers |
| `lineNumbers` | `boolean` | `false` | Alias for `showLineNumbers` |
| `showCopyButton` | `boolean` | `true` | Show copy button |
| `showExportButtons` | `boolean` | `false` | Show PNG/JPG export buttons |
| `showLanguage` | `boolean` | `true` | Show language label |
| `exportFileName` | `string` | `"code-snippet"` | Base filename used for image downloads |
| `highlightLines` | `number[]` | `[]` | Highlight specific lines |
| `className` | `string` | - | Extra class name |
| `style` | `React.CSSProperties` | - | Inline styles |

## Supported languages

The built-in grammars support these language names and aliases:

- C: `c`, `h`
- C++: `cpp`, `cxx`, `cc`, `hpp`, `hxx`
- Go: `go`
- JavaScript: `javascript`, `js`, `jsx`, `mjs`
- Python: `python`, `py`
- Rust: `rust`, `rs`
- TypeScript: `typescript`, `ts`, `tsx`
- Flowcharts: `mermaid`

## Themes

Built-in theme names are lazy-loaded by the component:

- `"catppuccin-mocha"`
- `"catppuccin-macchiato"`
- `"catppuccin-frappe"`
- `"catppuccin-latte"`
- `"anysphere"`

Theme objects are still exported from the package if you want to import them directly:

- `catppuccinMocha`
- `catppuccinMacchiato`
- `catppuccinFrappe`
- `catppuccinLatte`
- `anysphereTheme` / `anySphereTheme`

## License

MIT
