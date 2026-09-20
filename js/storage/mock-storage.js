/**
 * MOCK / LOCAL STORAGE ADAPTER
 * Provides high quality pre-populated receipt articles and persists modifications
 * to browser localStorage when offline or before connecting a live backend.
 */

import { StorageInterface } from './storage-interface.js';

const SEED_POSTS = [
  {
    id: "rec-001",
    slipNumber: "008491",
    station: "TERMINAL #01",
    date: "2026-09-18",
    time: "21:42:10",
    title: "THE POETICS OF 1-BIT MONOCHROME",
    author: "user",
    tags: ["AESTHETICS", "DITHERING", "GRAPHICS"],
    summary: "Reflections on limiting oneself to two colors: black and white, presence and absence.",
    items: [
      { qty: "01", name: "Bayer Matrix Stippling", price: "READ" },
      { qty: "02", name: "Error Diffusion Philosophy", price: "READ" },
      { qty: "03", name: "Memory Savings of 1-Bit", price: "READ" }
    ],
    readingTime: "3 MIN",
    wordCount: 520,
    stamp: "ORIGINAL",
    content: `
When you remove color from an interface, you are not taking something away—you are forcing geometry, rhythm, and texture to speak without distraction.

![THERMAL SYSTEM v0.9 // 1-BIT DITHER](assets/retro_terminal_1bit.jpg)

### The Thermal Paper Metaphor
The thermal printer receipt is one of the purest forms of computational print. It does not use ink ribbons or toner cartridges. Instead, a miniature line of heating elements burns microscopic dots directly onto chemically treated paper.
* High thermal contrast.
* Zero grayscale nuance—either the heat element fires, or it does not.
* A transient slip of paper meant to commemorate a moment in time: a transaction, a note, a dispatch.

\`\`\`
  +-------------------------------+
  |  1-BIT THERMAL LOGIC          |
  |  0 = PAPER BASE (WHITE)       |
  |  1 = THERMAL BURN (BLACK)     |
  +-------------------------------+
\`\`\`

By applying 1-bit ordered dithering algorithms (such as the classic Bayer 4x4 and 8x8 matrices), we can simulate gradient and light purely through spatial frequency. It turns human perception into an optical filter.
    `
  },
  {
    id: "rec-002",
    slipNumber: "008492",
    station: "TERMINAL #02",
    date: "2026-09-19",
    time: "14:15:33",
    title: "BUILDING IN THE OPEN WITH MONOSPACED CONSTRAINTS",
    author: "user",
    tags: ["DEVELOPMENT", "MINIMALISM", "WEB"],
    summary: "Why fixed-width typography and structural borders keep writing honest and focused.",
    items: [
      { qty: "01", name: "Fixed Width Architecture", price: "READ" },
      { qty: "02", name: "Perforated Layouts", price: "READ" },
      { qty: "03", name: "Vercel Read-Only Deployment", price: "READ" }
    ],
    readingTime: "4 MIN",
    wordCount: 680,
    stamp: "VERIFIED",
    content: `
Modern web design frequently drowns in decorative fluff: 12-layer box shadows, 4K background video loops, and complex bloated JavaScript bundles.

### The Beauty of Fixed Constraints
When you constrain yourself to monospaced typography and receipt ticket structures:
1. **Vertical and Horizontal Alignment is Absolute**: Every letter takes up the exact same character cell. Tables, dividers, and boxes can be crafted with simple ASCII and Unicode glyphs.
2. **Speed is Unmatched**: The entire page renders in milliseconds. No layout shifts, no slow font flashes.
3. **The Visitor Focuses on Words**: A blog is fundamentally about reading. When the article feels like a receipt handed to you at a counter, it feels tangible.

> "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."
> — Antoine de Saint-Exupéry
    `
  },
  {
    id: "rec-003",
    slipNumber: "008493",
    station: "TERMINAL #03",
    date: "2026-09-19",
    time: "22:10:05",
    title: "DITHER LAB: HOW ORDERED & ERROR-DIFFUSION ALGORITHMS WORK",
    author: "user",
    tags: ["ALGORITHMS", "CANVAS", "TUTORIAL"],
    summary: "A technical breakdown of Bayer matrix stippling versus Floyd-Steinberg error distribution.",
    items: [
      { qty: "01", name: "Bayer Ordered Dithering", price: "READ" },
      { qty: "02", name: "Floyd-Steinberg Error Math", price: "READ" },
      { qty: "03", name: "Atkinson 1-Bit Diffusion", price: "READ" }
    ],
    readingTime: "5 MIN",
    wordCount: 840,
    stamp: "PAID",
    content: `
How do we convert a full 24-bit RGB photo into crisp, 1-bit thermal printer art?

### 1. The Bayer Ordered Dithering Matrix
Ordered dithering works by comparing each pixel's luminance against a repeating threshold matrix:

\`\`\`
Bayer 4x4 Matrix:
[   0, 128,  32, 160 ]
[ 192,  64, 224,  96 ]
[  48, 176,  16, 144 ]
[ 240, 112, 208,  80 ]
\`\`\`

If the pixel brightness is lower than the corresponding threshold at (x mod 4, y mod 4), we output 0 (black dot). Otherwise, we output 255 (paper white). This produces the iconic cross-hatch stippling seen on early Macintosh and Game Boy displays!

### 2. Floyd-Steinberg Error Diffusion
Unlike Bayer, Floyd-Steinberg calculates the quantization error of the current pixel:
\`\`\`
error = old_pixel_value - new_pixel_value
\`\`\`
And diffuses that error to the surrounding unvisited neighboring pixels:
* 7/16 to the right (x + 1, y)
* 3/16 to bottom-left (x - 1, y + 1)
* 5/16 to directly below (x, y + 1)
* 1/16 to bottom-right (x + 1, y + 1)

The result is smooth organic stippling that preserves photographic gradients without noticeable grid patterns.
    `
  }
];

const LOCAL_STORAGE_KEY = 'receipt_blog_posts_v1';

export class MockStorage extends StorageInterface {
  constructor() {
    super();
    this.initStorage();
  }

  initStorage() {
    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_POSTS));
    }
  }

  async getPosts() {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return SEED_POSTS;
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_POSTS;
    }
  }

  async getPost(id) {
    const posts = await this.getPosts();
    return posts.find(p => p.id === id) || null;
  }

  async savePost(post, adminKey) {
    const posts = await this.getPosts();
    const existingIndex = posts.findIndex(p => p.id === post.id);

    if (existingIndex >= 0) {
      posts[existingIndex] = { ...posts[existingIndex], ...post, updatedAt: new Date().toISOString() };
    } else {
      const newPost = {
        ...post,
        id: post.id || `rec-${Date.now().toString(36)}`,
        slipNumber: post.slipNumber || String(8490 + posts.length + 1).padStart(6, '0'),
        date: post.date || new Date().toISOString().split('T')[0],
        time: post.time || new Date().toTimeString().split(' ')[0],
        createdAt: new Date().toISOString()
      };
      posts.unshift(newPost);
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(posts));
    return post;
  }

  async deletePost(id, adminKey) {
    let posts = await this.getPosts();
    posts = posts.filter(p => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(posts));
    return { success: true, id };
  }
}
