import { CheckIcon, CopyIcon } from "./CodeIcons";

interface CodeHeaderProps {
  language: string;
  copied: boolean;
  showLanguage: boolean;
  showCopyButton: boolean;
  onCopy: () => void;
}

export function CodeHeader({
  language,
  copied,
  showLanguage,
  showCopyButton,
  onCopy,
}: CodeHeaderProps) {
  return (
    <div className="code-markdown__header">
      {showLanguage && (
        <span className="code-markdown__language">{language}</span>
      )}
      {showCopyButton && (
        <button
          className="code-markdown__copy"
          onClick={onCopy}
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      )}
    </div>
  );
}
