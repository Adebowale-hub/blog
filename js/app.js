/**
 * MAIN BLOG APPLICATION CONTROLLER
 * Orchestrates storage, view rendering, routing, search & tag filtering, and theme switching.
 */

import { GitHubStorage } from './storage/github-storage.js';
import { ReceiptView } from './ui/receipt-view.js';
import { AdminModal } from './ui/admin-modal.js';

class App {
  constructor() {
    this.storage = new GitHubStorage('Adebowale-hub', 'blog', 'main', 'posts.json');
    this.view = new ReceiptView();
    this.admin = new AdminModal(this.storage, () => this.refreshData());

    this.allPosts = [];
    this.filteredPosts = [];
    this.activeTag = null;
    this.searchQuery = '';

    this.feedContainer = document.getElementById('receipts-container');
    this.tagCloudEl = document.getElementById('tag-cloud');
    this.searchInput = document.getElementById('search-input');
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.newPostBtn = document.getElementById('new-post-btn');
    this.adminLockBtn = document.getElementById('admin-lock-btn');
  }

  async init() {
    this.initTheme();
    this.initSound();
    this.admin.init();
    this.bindEvents();

    await this.refreshData();
    this.handleRoute();

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  initTheme() {
    const savedTheme = localStorage.getItem('receipt_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('receipt_theme', next);
    this.updateThemeButton(next);
  }

  updateThemeButton(theme) {
    if (this.themeToggleBtn) {
      this.themeToggleBtn.textContent = theme === 'dark' ? '[ INVERT: ON ]' : '[ INVERT: OFF ]';
    }
  }

  initSound() {
    this.updateSoundButton(this.view.soundEnabled);
  }

  toggleSound() {
    const enabled = this.view.toggleSound();
    this.updateSoundButton(enabled);
  }

  updateSoundButton(enabled) {
    if (this.soundToggleBtn) {
      this.soundToggleBtn.textContent = enabled ? '[ AUDIO: ON ]' : '[ AUDIO: MUTE ]';
    }
  }

  bindEvents() {
    // Theme toggle
    this.themeToggleBtn?.addEventListener('click', () => this.toggleTheme());

    // Sound toggle
    this.soundToggleBtn?.addEventListener('click', () => this.toggleSound());

    // Search input
    this.searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.applyFilters();
    });

    // Admin / New Post triggers
    this.newPostBtn?.addEventListener('click', () => this.admin.open());
    this.adminLockBtn?.addEventListener('click', () => this.admin.open());
  }

  async refreshData() {
    this.allPosts = await this.storage.getPosts();
    this.renderTagCloud();
    this.applyFilters();
  }

  renderTagCloud() {
    if (!this.tagCloudEl) return;
    const tagCounts = {};
    this.allPosts.forEach(post => {
      (post.tags || []).forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    const tags = Object.keys(tagCounts);
    if (tags.length === 0) {
      this.tagCloudEl.innerHTML = '';
      return;
    }

    this.tagCloudEl.innerHTML = `
      <button class="tag-chip ${!this.activeTag ? 'active' : ''}" data-tag="">ALL</button>
      ${tags.map(t => `
        <button class="tag-chip ${this.activeTag === t ? 'active' : ''}" data-tag="${t}">
          #${t} (${tagCounts[t]})
        </button>
      `).join('')}
    `;

    this.tagCloudEl.querySelectorAll('.tag-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        this.activeTag = tag || null;
        this.renderTagCloud();
        this.applyFilters();
      });
    });
  }

  applyFilters() {
    this.filteredPosts = this.allPosts.filter(post => {
      // Tag filter
      if (this.activeTag && !(post.tags || []).includes(this.activeTag)) {
        return false;
      }
      // Search filter
      if (this.searchQuery) {
        const matchTitle = (post.title || '').toLowerCase().includes(this.searchQuery);
        const matchSummary = (post.summary || '').toLowerCase().includes(this.searchQuery);
        const matchContent = (post.content || '').toLowerCase().includes(this.searchQuery);
        const matchTags = (post.tags || []).some(t => t.toLowerCase().includes(this.searchQuery));
        if (!matchTitle && !matchSummary && !matchContent && !matchTags) {
          return false;
        }
      }
      return true;
    });

    // If on feed route, re-render feed
    if (!window.location.hash.startsWith('#post/')) {
      this.view.renderFeed(this.filteredPosts, this.feedContainer, (id) => {
        window.location.hash = `#post/${id}`;
      });
    }
  }

  handleRoute() {
    const hash = window.location.hash;
    const filterBar = document.getElementById('filter-bar');

    if (hash.startsWith('#post/')) {
      const id = hash.replace('#post/', '');
      const post = this.allPosts.find(p => p.id === id);

      if (filterBar) filterBar.style.display = 'none';

      if (post) {
        this.view.renderSinglePost(
          post,
          this.feedContainer,
          () => { window.location.hash = ''; },
          (p) => { this.admin.open(p); }
        );
      } else {
        this.feedContainer.innerHTML = `
          <div class="receipt-wrapper">
            <div class="receipt-ticket">
              <div class="receipt-header">
                <div class="store-brand">404 NOT FOUND</div>
                <div class="store-tagline">RECEIPT TICKET DOES NOT EXIST</div>
              </div>
              <div style="text-align: center; margin: 2rem 0;">
                <a href="#" class="back-btn">&larr; RETURN TO FEED</a>
              </div>
            </div>
          </div>
        `;
      }
    } else {
      if (filterBar) filterBar.style.display = 'flex';
      this.view.renderFeed(this.filteredPosts, this.feedContainer, (id) => {
        window.location.hash = `#post/${id}`;
      });
    }
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
