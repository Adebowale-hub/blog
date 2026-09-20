/**
 * 1-BIT DITHER ENGINE
 * Implements Bayer Ordered (4x4, 8x8), Floyd-Steinberg, and Atkinson dithering.
 * Pure monochrome (0 = Black, 255 = White) output for authentic thermal printer aesthetics.
 */

export class DitherEngine {
  // Bayer 4x4 Matrix (normalized to 0..255)
  static BAYER_4X4 = [
    [  0, 128,  32, 160 ],
    [192,  64, 224,  96 ],
    [ 48, 176,  16, 144 ],
    [240, 112, 208,  80 ]
  ];

  // Bayer 8x8 Matrix
  static BAYER_8X8 = [
    [  0,  32,   8,  40,   2,  34,  10,  42 ],
    [ 48,  16,  56,  24,  50,  18,  58,  26 ],
    [ 12,  44,   4,  36,  14,  46,   6,  38 ],
    [ 60,  28,  52,  20,  62,  30,  54,  22 ],
    [  3,  35,  11,  43,   1,  33,   9,  41 ],
    [ 51,  19,  59,  27,  49,  17,  57,  25 ],
    [ 15,  47,   7,  39,  13,  45,   5,  37 ],
    [ 63,  31,  55,  23,  61,  29,  53,  21 ]
  ].map(row => row.map(v => Math.round((v / 64) * 255)));

  /**
   * Convert image data to grayscale with contrast & brightness adjustments
   */
  static preprocessGrayscale(data, width, height, contrast = 1.0, brightness = 0) {
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      // Perceptual luminance weights
      let lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      // Apply brightness (-100 to 100)
      lum += brightness;

      // Apply contrast (0.5 to 3.0)
      lum = (lum - 128) * contrast + 128;

      gray[i] = Math.min(255, Math.max(0, lum));
    }
    return gray;
  }

  /**
   * Bayer Ordered Dithering (4x4 or 8x8)
   */
  static ditherBayer(imageData, matrixSize = 4, contrast = 1.0, brightness = 0, invert = false) {
    const { width, height, data } = imageData;
    const gray = this.preprocessGrayscale(data, width, height, contrast, brightness);
    const matrix = matrixSize === 8 ? this.BAYER_8X8 : this.BAYER_4X4;
    const mSize = matrixSize;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const threshold = matrix[y % mSize][x % mSize];
        const val = gray[i] < threshold ? (invert ? 255 : 0) : (invert ? 0 : 255);
        const outIdx = i * 4;
        data[outIdx] = val;
        data[outIdx + 1] = val;
        data[outIdx + 2] = val;
        data[outIdx + 3] = 255;
      }
    }
    return imageData;
  }

  /**
   * Floyd-Steinberg Error Diffusion Dithering
   */
  static ditherFloydSteinberg(imageData, contrast = 1.0, brightness = 0, invert = false) {
    const { width, height, data } = imageData;
    const gray = this.preprocessGrayscale(data, width, height, contrast, brightness);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = gray[idx];
        const newVal = oldVal < 128 ? 0 : 255;
        const error = oldVal - newVal;

        const pixelVal = (newVal === 0) ? (invert ? 255 : 0) : (invert ? 0 : 255);
        const outIdx = idx * 4;
        data[outIdx] = pixelVal;
        data[outIdx + 1] = pixelVal;
        data[outIdx + 2] = pixelVal;
        data[outIdx + 3] = 255;

        // Distribute error
        if (x + 1 < width) {
          gray[idx + 1] += error * (7 / 16);
        }
        if (y + 1 < height) {
          if (x - 1 >= 0) {
            gray[(y + 1) * width + (x - 1)] += error * (3 / 16);
          }
          gray[(y + 1) * width + x] += error * (5 / 16);
          if (x + 1 < width) {
            gray[(y + 1) * width + (x + 1)] += error * (1 / 16);
          }
        }
      }
    }
    return imageData;
  }

  /**
   * Atkinson Dithering (Vintage Mac 1-bit aesthetic)
   */
  static ditherAtkinson(imageData, contrast = 1.0, brightness = 0, invert = false) {
    const { width, height, data } = imageData;
    const gray = this.preprocessGrayscale(data, width, height, contrast, brightness);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = gray[idx];
        const newVal = oldVal < 128 ? 0 : 255;
        const error = Math.floor((oldVal - newVal) / 8);

        const pixelVal = (newVal === 0) ? (invert ? 255 : 0) : (invert ? 0 : 255);
        const outIdx = idx * 4;
        data[outIdx] = pixelVal;
        data[outIdx + 1] = pixelVal;
        data[outIdx + 2] = pixelVal;
        data[outIdx + 3] = 255;

        if (error === 0) continue;

        // Atkinson distributes 1/8 error to 6 neighbors
        if (x + 1 < width) gray[idx + 1] += error;
        if (x + 2 < width) gray[idx + 2] += error;
        if (y + 1 < height) {
          if (x - 1 >= 0) gray[(y + 1) * width + (x - 1)] += error;
          gray[(y + 1) * width + x] += error;
          if (x + 1 < width) gray[(y + 1) * width + (x + 1)] += error;
        }
        if (y + 2 < height) {
          gray[(y + 2) * width + x] += error;
        }
      }
    }
    return imageData;
  }

  /**
   * Process an HTML Image or Canvas source and return a new dithered canvas
   */
  static processImage(sourceImage, {
    algorithm = 'floyd', // 'floyd' | 'bayer4' | 'bayer8' | 'atkinson'
    maxWidth = 480,
    contrast = 1.15,
    brightness = 0,
    invert = false
  } = {}) {
    // Calculate aspect ratio scale
    let width = sourceImage.width || sourceImage.videoWidth || maxWidth;
    let height = sourceImage.height || sourceImage.videoHeight || maxWidth;

    if (width > maxWidth) {
      const scale = maxWidth / width;
      width = Math.round(maxWidth);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Draw source scaled
    ctx.drawImage(sourceImage, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    // Apply chosen dither algorithm
    switch (algorithm) {
      case 'bayer4':
        this.ditherBayer(imageData, 4, contrast, brightness, invert);
        break;
      case 'bayer8':
        this.ditherBayer(imageData, 8, contrast, brightness, invert);
        break;
      case 'atkinson':
        this.ditherAtkinson(imageData, contrast, brightness, invert);
        break;
      case 'floyd':
      default:
        this.ditherFloydSteinberg(imageData, contrast, brightness, invert);
        break;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
}
