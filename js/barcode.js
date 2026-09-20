/**
 * BARCODE & QR MATRIX GENERATOR
 * Generates 1-bit monochrome Code-128 style barcodes and matrix graphics for receipts.
 */

export class BarcodeGenerator {
  /**
   * Deterministic pattern generator based on text/ID to create an authentic-looking barcode SVG
   */
  static generateSVG(text = 'RECEIPT-2026', width = 240, height = 48) {
    // Generate pseudo-random bar pattern seeded by string
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
    }

    const rng = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 4294967296;
    };

    // Construct SVG bars
    const totalBars = 65;
    const barWidth = width / totalBars;
    let svgBars = '';
    let x = 0;

    // Start guard bars
    svgBars += `<rect x="${x}" y="0" width="${barWidth * 1.5}" height="${height}" fill="currentColor" />`;
    x += barWidth * 2.5;
    svgBars += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="currentColor" />`;
    x += barWidth * 2;

    for (let i = 0; i < totalBars - 10; i++) {
      const isBlack = rng() > 0.42;
      const w = rng() > 0.7 ? barWidth * 2 : barWidth;
      if (isBlack) {
        svgBars += `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${height}" fill="currentColor" />`;
      }
      x += w;
      if (x >= width - barWidth * 5) break;
    }

    // Stop guard bars
    x = width - barWidth * 4;
    svgBars += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="currentColor" />`;
    x += barWidth * 1.8;
    svgBars += `<rect x="${x}" y="0" width="${barWidth * 2}" height="${height}" fill="currentColor" />`;

    return `
      <svg class="barcode-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="Barcode for ${text}">
        ${svgBars}
      </svg>
    `;
  }
}
