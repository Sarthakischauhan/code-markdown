import { CheckIcon, CopyIcon } from "./CodeIcons";

interface CodeHeaderProps {
  language: string;
  copied: boolean;
  showLanguage: boolean;
  showCopyButton: boolean;
  showExportButtons: boolean;
  isExporting: boolean;
  onCopy: () => void;
  onExport: (format: "png" | "jpg") => void;
}

export function CodeHeader({
  language,
  copied,
  showLanguage,
  showCopyButton,
  showExportButtons,
  isExporting,
  onCopy,
  onExport,
}: CodeHeaderProps) {
  if (!showLanguage && !showCopyButton && !showExportButtons) {
    return null;
  }

  return (
    <div className="code-markdown__header">
      {showLanguage && (
        <span className="code-markdown__language">{language}</span>
      )}
      <div className="code-markdown__actions" data-export-ignore="true">
        {showExportButtons && (
          <>
            <button
              type="button"
              className="code-markdown__export"
              onClick={() => onExport("png")}
              aria-label="Export PNG"
              title="Export PNG"
              disabled={isExporting}
            >
              PNG
            </button>
            <button
              type="button"
              className="code-markdown__export"
              onClick={() => onExport("jpg")}
              aria-label="Export JPG"
              title="Export JPG"
              disabled={isExporting}
            >
              JPG
            </button>
          </>
        )}
        {showCopyButton && (
          <button
            type="button"
            className="code-markdown__copy"
            onClick={onCopy}
            aria-label={copied ? "Copied!" : "Copy code"}
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        )}
      </div>
    </div>
  );
}
