import { useState } from "react";
import { anySphereTheme, CodeMarkdown, catppuccinMocha, catppuccinMacchiato, catppuccinFrappe, catppuccinLatte, type CodeTheme } from "../src";

const themes: { label: string; value: CodeTheme }[] = [
  { label: "Mocha", value: catppuccinMocha },
  { label: "Macchiato", value: catppuccinMacchiato },
  { label: "Frappe", value: catppuccinFrappe },
  { label: "Latte", value: catppuccinLatte },
  {label: "Cursro Dark", value: anySphereTheme}
];

const codeExamples = [
  {
    label: "React Hook",
    language: "tsx",
    code: `import { useState, useEffect } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;`,
  },
  {
    label: "Rust",
    language: "rust",
    code: `fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a: u64 = 0;
            let mut b: u64 = 1;
            for _ in 2..=n {
                let temp = b;
                b = a + b;
                a = temp;
            }
            b
        }
    }
}

fn main() {
    for i in 0..10 {
        println!("F({}) = {}", i, fibonacci(i));
    }
}`,
  },
  {
    label: "Go",
    language: "go",
    code: `package main

import (
    "fmt"
    "sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        fmt.Printf("worker %d processing job %d\\n", id, job)
        results <- job * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    var wg sync.WaitGroup
    for w := 1; w <= 3; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    for j := 1; j <= 9; j++ {
        jobs <- j
    }
    close(jobs)

    go func() {
        wg.Wait()
        close(results)
    }()

    for r := range results {
        fmt.Println("result:", r)
    }
}`,
  },
  {
    label: "Python",
    language: "python",
    code: `from dataclasses import dataclass
from typing import Generator

@dataclass
class TreeNode:
    value: int
    left: "TreeNode | None" = None
    right: "TreeNode | None" = None

def inorder_traversal(node: TreeNode | None) -> Generator[int, None, None]:
    if node is None:
        return
    yield from inorder_traversal(node.left)
    yield node.value
    yield from inorder_traversal(node.right)

def build_bst(values: list[int]) -> TreeNode | None:
    if not values:
        return None
    root = TreeNode(values[0])
    for val in values[1:]:
        insert(root, val)
    return root`,
  },
];

const fonts = [
  { label: "JetBrains Mono", value: '"JetBrains Mono", monospace' },
  { label: "Poppins + Mono", value: '"Poppins", sans-serif' },
  { label: "Fira Code", value: '"Fira Code", monospace' },
  { label: "System Mono", value: "monospace" },
];

export default function App() {
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [selectedFont, setSelectedFont] = useState(fonts[0]);
  const [selectedExample, setSelectedExample] = useState(codeExamples[0]);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [highlightLines, setHighlightLines] = useState<number[]>([]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#11111b",
        color: "#cdd6f4",
        fontFamily: '"Poppins", sans-serif',
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            marginBottom: "8px",
            background: "linear-gradient(135deg, #89b4fa, #cba6f7, #f38ba8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          code-markdown
        </h1>
        <p style={{ color: "#a6adc8", fontSize: "16px", marginBottom: "32px" }}>
          Beautiful code snippets for React. Pick a theme, font, and language below.
        </p>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <ControlGroup label="Theme">
            {themes.map((t) => (
              <button
                key={t.value.name}
                onClick={() => setSelectedTheme(t)}
                style={btnStyle(selectedTheme.value.name === t.value.name)}
              >
                {t.label}
              </button>
            ))}
          </ControlGroup>

          <ControlGroup label="Font">
            {fonts.map((f) => (
              <button
                key={f.value}
                onClick={() => setSelectedFont(f)}
                style={btnStyle(selectedFont.value === f.value)}
              >
                {f.label}
              </button>
            ))}
          </ControlGroup>

          <ControlGroup label="Language">
            {codeExamples.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setSelectedExample(ex)}
                style={btnStyle(selectedExample.label === ex.label)}
              >
                {ex.label}
              </button>
            ))}
          </ControlGroup>

          <ControlGroup label="Options">
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              style={btnStyle(showLineNumbers)}
            >
              Line Numbers
            </button>
            <button
              onClick={() =>
                setHighlightLines(
                  highlightLines.length > 0 ? [] : [2, 3, 4]
                )
              }
              style={btnStyle(highlightLines.length > 0)}
            >
              Highlight Lines
            </button>
          </ControlGroup>
        </div>

        {/* Code Block */}
        <CodeMarkdown
          theme={selectedTheme.value}
          font={selectedFont.value}
          language={selectedExample.language}
          showLineNumbers={showLineNumbers}
          showExportButtons
          highlightLines={highlightLines}
        >
          {selectedExample.code}
        </CodeMarkdown>

        {/* Usage Example */}
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            marginTop: "48px",
            marginBottom: "16px",
            color: "#cdd6f4",
          }}
        >
          Usage
        </h2>
        <CodeMarkdown language="tsx" theme={selectedTheme.value} font={selectedFont.value}>
          {`import { CodeMarkdown, catppuccinMocha } from "code-markdown";
import "code-markdown/styles.css";

function App() {
  return (
    <CodeMarkdown
      theme={catppuccinMocha}
      font='"Poppins", sans-serif'
      language="tsx"
      showLineNumbers
      showExportButtons
      highlightLines={[2, 3]}
    >
      {codeString}
    </CodeMarkdown>
  );
}`}
        </CodeMarkdown>
      </div>
    </div>
  );
}

function ControlGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#6c7086",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}

function btnStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px",
    borderRadius: "8px",
    border: `1px solid ${active ? "#89b4fa" : "#45475a"}`,
    background: active ? "rgba(137,180,250,0.15)" : "transparent",
    color: active ? "#89b4fa" : "#a6adc8",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
  };
}
