# THERMAL DISPATCH // 1-Bit Receipt Blog

A personal, monospaced black & white blog with an authentic **Thermal Receipt Ticket** aesthetic mixed with a real-time **1-Bit Dither Engine**.

Hosted on Vercel with read-only access for public visitors and a secure owner writing console.

---

## Features
- **Thermal Receipt Ticket Aesthetic**: Sawtooth jagged tear-off borders, cash register headers (`TERMINAL #01`), itemized breakdowns, reading time, "Priceless" subtotals, retro rubber stamps (`ORIGINAL`, `VERIFIED`, `PAID`), and dynamic Code-128 SVG barcodes.
- **Built-in 1-Bit Dither Engine**: Pure JavaScript HTML5 Canvas dithering supporting:
  - Bayer 4x4 Ordered Dithering
  - Bayer 8x8 Ordered Dithering
  - Floyd-Steinberg Error Diffusion
  - Atkinson 1-Bit Dithering
- **Read-Only Visitor Mode**: Fast global delivery on Vercel with keyword search, `#tag` filtering, and instant Invert Mode (Thermal Paper Ivory vs. Inverted LCD).
- **Physical Receipt Printing**: Native `@media print` support formatted for thermal receipt printers or paper.
- **Owner Writing Desk**: Protected by an access key prompt (accessible via `[ + NEW ]`, `OWNER ACCESS KEY` in the footer, or `Ctrl + Shift + A`).

---

## Deploy to Vercel

1. Import this repository into [Vercel](https://vercel.com).
2. (Optional) Set `ADMIN_PASSWORD` in your Vercel Environment Variables.
3. Deploy!
