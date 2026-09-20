/**
 * GITHUB REPOSITORY STORAGE ADAPTER
 * Stores and retrieves blog posts directly from a GitHub repository (e.g. Adebowale-hub/blog).
 * - Visitors: Read-only access via GitHub raw/contents API with ZERO auth required.
 * - Owner: Uses GitHub Personal Access Token (PAT) to commit and push updates directly to the repo.
 */

import { StorageInterface } from './storage-interface.js';
import { MockStorage } from './mock-storage.js';

export class GitHubStorage extends StorageInterface {
  constructor(owner = 'Adebowale-hub', repo = 'blog', branch = 'main', postsPath = 'posts.json') {
    super();
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.postsPath = postsPath;
    this.fallback = new MockStorage();
  }

  getRawUrl() {
    return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${this.postsPath}`;
  }

  getApiUrl() {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.postsPath}`;
  }

  async getPosts() {
    try {
      const res = await fetch(this.getRawUrl(), { cache: 'no-cache' });
      if (!res.ok) {
        // If file doesn't exist yet on GitHub, fallback to local seed posts
        return this.fallback.getPosts();
      }
      const data = await res.json();
      return Array.isArray(data) ? data : this.fallback.getPosts();
    } catch {
      return this.fallback.getPosts();
    }
  }

  async getPost(id) {
    const posts = await this.getPosts();
    return posts.find(p => p.id === id) || null;
  }

  async savePost(post, githubToken) {
    if (!githubToken) {
      // If no GitHub PAT token provided, save locally
      return this.fallback.savePost(post);
    }

    // 1. Fetch current posts & sha
    let posts = [];
    let fileSha = null;

    try {
      const res = await fetch(this.getApiUrl(), {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        const fileData = await res.json();
        fileSha = fileData.sha;
        const decoded = atob(fileData.content.replace(/\s/g, ''));
        posts = JSON.parse(decoded);
      }
    } catch {
      posts = await this.fallback.getPosts();
    }

    // 2. Update or insert post
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

    // 3. Commit updated posts.json to GitHub repository
    const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(posts, null, 2))));
    const commitRes = await fetch(this.getApiUrl(), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `chore: update receipt dispatch ${post.id || 'new'} [skip ci]`,
        content: contentEncoded,
        sha: fileSha || undefined,
        branch: this.branch
      })
    });

    if (!commitRes.ok) {
      const err = await commitRes.json();
      throw new Error(err.message || 'GitHub commit failed');
    }

    // Also update local fallback cache
    await this.fallback.savePost(post);
    return post;
  }

  async deletePost(id, githubToken) {
    if (!githubToken) {
      return this.fallback.deletePost(id);
    }

    let posts = [];
    let fileSha = null;

    const res = await fetch(this.getApiUrl(), {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) throw new Error('Could not access posts on GitHub');
    const fileData = await res.json();
    fileSha = fileData.sha;
    const decoded = atob(fileData.content.replace(/\s/g, ''));
    posts = JSON.parse(decoded);

    posts = posts.filter(p => p.id !== id);

    const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(posts, null, 2))));
    const commitRes = await fetch(this.getApiUrl(), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `chore: delete receipt dispatch ${id} [skip ci]`,
        content: contentEncoded,
        sha: fileSha,
        branch: this.branch
      })
    });

    if (!commitRes.ok) {
      const err = await commitRes.json();
      throw new Error(err.message || 'GitHub delete commit failed');
    }

    await this.fallback.deletePost(id);
    return { success: true, id };
  }
}
