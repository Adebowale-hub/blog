/**
 * VERCEL SERVERLESS FUNCTION: /api/posts
 * - GET: Read-only access for all visitors.
 * - POST / PUT / DELETE: Protected by ADMIN_PASSWORD environment variable.
 */

// In-memory / KV storage fallback for serverless execution
let postsDatabase = [];

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
