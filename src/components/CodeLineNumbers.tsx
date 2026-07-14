interface CodeLineNumbersProps {
  lines: string[];
  highlightLines: number[];
}

export function CodeLineNumbers({ lines, highlightLines }: CodeLineNumbersProps) {
  return (
    <div className="code-markdown__line-numbers" aria-hidden="true">
      {lines.map((_, i) => (
        <span
          key={i}
          className={`code-markdown__line-number ${
            highlightLines.includes(i + 1) ? "highlighted" : ""
          }`}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}
