/**
 * GITHUB REPOSITORY STORAGE ADAPTER
 * Stores and retrieves blog posts and 1-bit images directly from Adebowale-hub/blog.
 * - Visitors: Read-only access via GitHub raw CDN (zero auth required, always free).
 * - Owner: Uses GitHub Personal Access Token (PAT) to commit updates directly to the repo.
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

  getApiUrl(path = this.postsPath) {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
  }

  /**
   * Fetch latest posts from GitHub with cache-busting timestamp
   */
  async getPosts() {
    try {
      // Timestamp query bypasses raw.githubusercontent CDN cache so new posts appear on refresh
      const res = await fetch(`${this.getRawUrl()}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        return this.fallback.getPosts();
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        // Cache to local storage
        localStorage.setItem('receipt_blog_posts_v1', JSON.stringify(data));
        return data;
      }
      return this.fallback.getPosts();
    } catch (err) {
      console.warn('Could not reach GitHub raw CDN, loading cached/fallback posts:', err);
      return this.fallback.getPosts();
    }
  }

  async getPost(id) {
    const posts = await this.getPosts();
    return posts.find(p => p.id === id) || null;
  }

  /**
   * Upload a 1-bit dithered image directly to assets/uploads/ in the GitHub repository
   */
  async uploadImage(base64DataUrl, filename, githubToken) {
    if (!githubToken) {
      // Return data URL as fallback for local testing
      return base64DataUrl;
    }

    const cleanFilename = filename || `dither-${Date.now().toString(36)}.png`;
    const repoPath = `assets/uploads/${cleanFilename}`;
    const base64Content = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');

    const commitRes = await fetch(this.getApiUrl(repoPath), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `feat(media): upload 1-bit dithered image ${cleanFilename} [skip ci]`,
        content: base64Content,
        branch: this.branch
      })
    });

    if (!commitRes.ok) {
      const err = await commitRes.json().catch(() => ({}));
      console.warn('GitHub image commit failed, using data URL fallback:', err);
      return base64DataUrl;
    }

    // Return the relative asset path that works on both localhost and Vercel
    return `assets/uploads/${cleanFilename}`;
  }

  /**
   * Save / update a post in posts.json on GitHub
   */
  async savePost(post, githubToken) {
    if (!githubToken) {
      return this.fallback.savePost(post);
    }

    // 1. Fetch current posts & sha from GitHub API
    let posts = [];
    let fileSha = null;

    try {
      const res = await fetch(this.getApiUrl(this.postsPath), {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        const fileData = await res.json();
        fileSha = fileData.sha;
        const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
        posts = JSON.parse(decoded);
      }
    } catch {
      posts = await this.fallback.getPosts();
    }

    // 2. Insert or update the post
    const existingIndex = posts.findIndex(p => p.id === post.id);
    let updatedPost;

    if (existingIndex >= 0) {
      updatedPost = { ...posts[existingIndex], ...post, updatedAt: new Date().toISOString() };
      posts[existingIndex] = updatedPost;
    } else {
      updatedPost = {
        ...post,
        id: post.id || `rec-${Date.now().toString(36)}`,
        slipNumber: post.slipNumber || String(8490 + posts.length + 1).padStart(6, '0'),
        date: post.date || new Date().toISOString().split('T')[0],
        time: post.time || new Date().toTimeString().split(' ')[0],
        createdAt: new Date().toISOString()
      };
      posts.unshift(updatedPost);
    }

    // 3. Commit updated posts.json to GitHub
    const jsonString = JSON.stringify(posts, null, 2);
    const contentEncoded = btoa(unescape(encodeURIComponent(jsonString)));

    const commitRes = await fetch(this.getApiUrl(this.postsPath), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `chore: update receipt dispatch ${updatedPost.id} [skip ci]`,
        content: contentEncoded,
        sha: fileSha || undefined,
        branch: this.branch
      })
    });

    if (!commitRes.ok) {
      const err = await commitRes.json().catch(() => ({}));
      throw new Error(err.message || 'GitHub commit failed');
    }

    // Update local cache
    localStorage.setItem('receipt_blog_posts_v1', JSON.stringify(posts));
    return updatedPost;
  }

  /**
   * Delete a post from posts.json on GitHub
   */
  async deletePost(id, githubToken) {
    if (!githubToken) {
      return this.fallback.deletePost(id);
    }

    const res = await fetch(this.getApiUrl(this.postsPath), {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) throw new Error('Could not access posts on GitHub');
    const fileData = await res.json();
    const fileSha = fileData.sha;
    const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
    let posts = JSON.parse(decoded);

    posts = posts.filter(p => p.id !== id);

    const jsonString = JSON.stringify(posts, null, 2);
    const contentEncoded = btoa(unescape(encodeURIComponent(jsonString)));

    const commitRes = await fetch(this.getApiUrl(this.postsPath), {
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
      const err = await commitRes.json().catch(() => ({}));
      throw new Error(err.message || 'GitHub delete commit failed');
    }

    localStorage.setItem('receipt_blog_posts_v1', JSON.stringify(posts));
    return { success: true, id };
  }
}
