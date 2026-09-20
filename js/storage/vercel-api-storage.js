/**
 * VERCEL API STORAGE ADAPTER
 * Connects to /api/posts Vercel Serverless Function.
 * Visitors get read-only access via GET /api/posts.
 * Owner can POST, PUT, DELETE with Bearer ADMIN_PASSWORD authorization.
 */

import { StorageInterface } from './storage-interface.js';
import { MockStorage } from './mock-storage.js';

export class VercelApiStorage extends StorageInterface {
  constructor(apiBase = '/api/posts') {
    super();
    this.apiBase = apiBase;
    this.fallback = new MockStorage();
  }

  async getPosts() {
    try {
      const res = await fetch(this.apiBase);
      if (!res.ok) throw new Error(`Vercel API returned ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : this.fallback.getPosts();
    } catch (err) {
      console.warn('Vercel API not available locally or offline, falling back to local storage:', err);
      return this.fallback.getPosts();
    }
  }

  async getPost(id) {
    try {
      const res = await fetch(`${this.apiBase}?id=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`Vercel API returned ${res.status}`);
      return await res.json();
    } catch {
      return this.fallback.getPost(id);
    }
  }

  async savePost(post, adminKey) {
    try {
      const res = await fetch(this.apiBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey || ''}`
        },
        body: JSON.stringify(post)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('Vercel API save failed, saving locally:', err);
      return this.fallback.savePost(post, adminKey);
    }
  }

  async deletePost(id, adminKey) {
    try {
      const res = await fetch(`${this.apiBase}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminKey || ''}`
        }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('Vercel API delete failed, deleting locally:', err);
      return this.fallback.deletePost(id, adminKey);
    }
  }
}
