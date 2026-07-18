interface CodeBodyProps {
  html: string;
  showLineNumbers: boolean;
}

export function CodeBody({ html, showLineNumbers }: CodeBodyProps) {
  return (
    <div
      className={`code-markdown__body ${
        showLineNumbers ? "code-markdown__body--line-numbers" : ""
      }`}
    >
      <div
        className="code-markdown__code"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
