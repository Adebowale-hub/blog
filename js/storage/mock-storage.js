/**
 * MOCK / LOCAL STORAGE ADAPTER
 * Provides high quality pre-populated receipt articles and persists modifications
 * to browser localStorage when offline or before connecting a live backend.
 */

import { StorageInterface } from './storage-interface.js';

const SEED_POSTS = [];

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
