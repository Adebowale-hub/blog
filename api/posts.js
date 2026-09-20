/**
 * VERCEL SERVERLESS FUNCTION: /api/posts
 * - GET: Read-only access for all visitors.
 * - POST / PUT / DELETE: Protected by ADMIN_PASSWORD environment variable.
 */

// In-memory / KV mock storage fallback for serverless execution
let postsDatabase = [
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
    `
  }
];

export default async function handler(req, res) {
  // Set CORS and Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- GET (PUBLIC READ-ONLY) ---
  if (req.method === 'GET') {
    const { id } = req.query || {};
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    if (id) {
      const post = postsDatabase.find(p => p.id === id);
      if (!post) {
        return res.status(404).json({ error: 'Receipt not found' });
      }
      return res.status(200).json(post);
    }

    return res.status(200).json(postsDatabase);
  }

  // --- WRITE OPERATIONS: PROTECTED BY ADMIN_PASSWORD ---
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin';

  if (!token || token !== expectedPassword) {
    return res.status(401).json({
      error: 'Unauthorized: Only the owner with the correct admin key has write permission.'
    });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const postData = req.body;
    if (!postData || !postData.title) {
      return res.status(400).json({ error: 'Post title is required' });
    }

    const index = postsDatabase.findIndex(p => p.id === postData.id);
    if (index >= 0) {
      postsDatabase[index] = { ...postsDatabase[index], ...postData, updatedAt: new Date().toISOString() };
      return res.status(200).json(postsDatabase[index]);
    } else {
      const newPost = {
        ...postData,
        id: postData.id || `rec-${Date.now().toString(36)}`,
        slipNumber: postData.slipNumber || String(8490 + postsDatabase.length + 1).padStart(6, '0'),
        date: postData.date || new Date().toISOString().split('T')[0],
        time: postData.time || new Date().toTimeString().split(' ')[0],
        createdAt: new Date().toISOString()
      };
      postsDatabase.unshift(newPost);
      return res.status(201).json(newPost);
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }
    postsDatabase = postsDatabase.filter(p => p.id !== id);
    return res.status(200).json({ success: true, id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
