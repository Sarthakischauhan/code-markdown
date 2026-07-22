export function invertHex(hex: string) {
  const cleanHex = hex.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return "#ffffff";
  }

  const inverted = (0xffffff ^ parseInt(cleanHex, 16)).toString(16);
  return `#${inverted.padStart(6, "0").toUpperCase()}`;
}

function hexToRgba(hex: string, alpha: number) {
  const cleanHex = hex.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return `rgba(255, 255, 255, ${alpha})`;
  }

  const value = parseInt(cleanHex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function buildExportCanvas(
  snippetCanvas: HTMLCanvasElement,
  invertedBackground: string,
  pixelRatio: number
) {
  const padding = Math.round(32 * pixelRatio);
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = snippetCanvas.width + padding * 2;
  exportCanvas.height = snippetCanvas.height + padding * 2;

  const context = exportCanvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create export canvas context");
  }

  context.fillStyle = invertedBackground;
  context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  const topRightGlow = context.createRadialGradient(
    exportCanvas.width * 0.82,
    exportCanvas.height * 0.18,
    0,
    exportCanvas.width * 0.82,
    exportCanvas.height * 0.18,
    Math.max(exportCanvas.width, exportCanvas.height) * 0.42
  );
  topRightGlow.addColorStop(0, hexToRgba(invertedBackground, 0.12));
  topRightGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = topRightGlow;
  context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  const bottomLeftGlow = context.createRadialGradient(
    exportCanvas.width * 0.18,
    exportCanvas.height * 0.82,
    0,
    exportCanvas.width * 0.18,
    exportCanvas.height * 0.82,
    Math.max(exportCanvas.width, exportCanvas.height) * 0.38
  );
  bottomLeftGlow.addColorStop(0, hexToRgba(invertedBackground, 0.08));
  bottomLeftGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = bottomLeftGlow;
  context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  const diagonalGlow = context.createLinearGradient(
    0,
    0,
    exportCanvas.width,
    exportCanvas.height
  );
  diagonalGlow.addColorStop(0, hexToRgba(invertedBackground, 0.05));
  diagonalGlow.addColorStop(0.58, "rgba(0, 0, 0, 0)");
  context.fillStyle = diagonalGlow;
  context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  context.drawImage(snippetCanvas, padding, padding);
  return exportCanvas;
}
