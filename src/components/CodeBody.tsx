import { CodeLineNumbers } from "./CodeLineNumbers";

interface CodeBodyProps {
  html: string;
  lines: string[];
  showLineNumbers: boolean;
  highlightLines: number[];
}

export function CodeBody({
  html,
  lines,
  showLineNumbers,
  highlightLines,
}: CodeBodyProps) {
  return (
    <div className="code-markdown__body">
      {showLineNumbers && (
        <CodeLineNumbers lines={lines} highlightLines={highlightLines} />
      )}
      <div
        className="code-markdown__code"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
