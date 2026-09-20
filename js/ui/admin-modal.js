/**
 * ADMIN WRITING DESK & 1-BIT DITHER LAB
 * In-page authentic thermal register console for the owner.
 * Features inline authentication, 1-bit image dithering processor,
 * and live post management.
 */

import { DitherEngine } from '../dither-engine.js';

export class AdminModal {
  constructor(storage, onPostSaved) {
    this.storage = storage;
    this.onPostSaved = onPostSaved;
    this.currentPost = null;
    this.modalEl = null;
    this.sourceImage = null;
    this.processedCanvas = null;

    this.adminPasswordKey = 'github_blog_token';
  }

  getAdminKey() {
    return localStorage.getItem(this.adminPasswordKey) || '';
  }

  setAdminKey(key) {
    localStorage.setItem(this.adminPasswordKey, key);
  }

  init() {
    this.renderModal();
    this.bindGlobalShortcut();
  }

  bindGlobalShortcut() {
    window.addEventListener('keydown', (e) => {
      // Ctrl + Shift + A or Cmd + Shift + A to open Admin Writing Desk
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        this.open();
      }
    });
  }

  open(postToEdit = null) {
    this.currentPost = postToEdit;
    const adminKey = this.getAdminKey();

    const authSection = this.modalEl.querySelector('#admin-auth-section');
    const formSection = this.modalEl.querySelector('#admin-form-section');

    if (!adminKey) {
      authSection.style.display = 'flex';
      formSection.style.display = 'none';
      setTimeout(() => this.modalEl.querySelector('#auth-key-input')?.focus(), 50);
    } else {
      authSection.style.display = 'none';
      formSection.style.display = 'flex';
      this.populateForm(this.currentPost);
    }

    this.modalEl.classList.add('open');
  }

  close() {
    this.modalEl.classList.remove('open');
    this.currentPost = null;
  }

  renderModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'admin-modal-backdrop';

    backdrop.innerHTML = `
      <div class="admin-desk" role="dialog" aria-label="Owner Writing Desk">
        <div class="admin-desk-header">
          <span>&gt; THERMAL WRITING DESK [GITHUB OWNER CONSOLE]</span>
          <button class="close-btn" id="close-admin-btn">&times;</button>
        </div>

        <div class="admin-desk-body">
          <!-- INLINE GITHUB AUTHENTICATION SECTION -->
          <div id="admin-auth-section" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2rem 1rem; gap: 0.9rem;">
            <div style="font-family: var(--font-display); font-size: 2.2rem; letter-spacing: 0.08em;">
              *** GITHUB STORAGE ACCESS ***
            </div>
            <p style="font-family: var(--font-mono); font-size: 0.8rem; max-width: 460px; line-height: 1.5; color: var(--ink-secondary);">
              Connect your <strong>Adebowale-hub/blog</strong> repository so posts and 1-bit images save permanently to GitHub.
            </p>
            <div style="font-family: var(--font-mono); font-size: 0.75rem; background: var(--paper-shade); border: 1px dashed var(--ink); padding: 0.8rem; max-width: 460px; text-align: left;">
              1. Generate a GitHub Personal Access Token (classic) with <code>repo</code> scope.<br>
              2. <a href="https://github.com/settings/tokens/new?scopes=repo&description=ThermalBlogToken" target="_blank" rel="noopener" style="color: var(--ink); text-decoration: underline; font-weight: bold;">Click here to generate your token &rarr;</a><br>
              3. Paste the token below. It will stay securely in your browser only.
            </div>
            <div style="display: flex; gap: 0.5rem; width: 100%; max-width: 460px; margin-top: 0.3rem;">
              <input 
                type="password" 
                id="auth-key-input" 
                class="form-input" 
                placeholder="Paste GitHub Token (ghp_...)" 
                style="flex: 1; font-family: var(--font-mono); font-size: 0.8rem;"
              />
              <button type="button" class="btn-primary" id="auth-unlock-btn">
                CONNECT
              </button>
            </div>
          </div>

          <!-- POST COMPOSER & DITHER LAB SECTION -->
          <div id="admin-form-section" style="display: none; flex-direction: column; gap: 1.2rem;">
            <div class="form-group">
              <label class="form-label" for="post-title">Receipt Title</label>
              <input type="text" id="post-title" class="form-input" placeholder="e.g. THOUGHTS ON 1-BIT ARCHITECTURE" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
              <div class="form-group">
                <label class="form-label" for="post-station">Station ID</label>
                <input type="text" id="post-station" class="form-input" value="TERMINAL #01" />
              </div>
              <div class="form-group">
                <label class="form-label" for="post-stamp">Retro Stamp</label>
                <select id="post-stamp" class="form-select">
                  <option value="ORIGINAL">ORIGINAL</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="PAID">PAID</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                  <option value="">NONE</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="post-tags">Tags (comma separated)</label>
              <input type="text" id="post-tags" class="form-input" placeholder="TECH, AESTHETICS, MONOCHROME" />
            </div>

            <div class="form-group">
              <label class="form-label" for="post-summary">Receipt Memo / Summary</label>
              <input type="text" id="post-summary" class="form-input" placeholder="Brief summary displayed on the ticket slip" />
            </div>

            <!-- 1-BIT DITHER IMAGE LAB -->
            <div class="dither-lab">
              <div style="font-family: var(--font-mono); font-weight: 700; font-size: 0.8rem;">
                &bull; 1-BIT DITHER IMAGE PROCESSOR
              </div>
              <p style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-faint);">
                Drop any photo here to convert it into crisp 1-bit thermal printer art:
              </p>

              <div class="drop-zone" id="dither-drop-zone">
                CLICK OR DRAG IMAGE HERE
                <input type="file" id="dither-file-input" accept="image/*" style="display: none;" />
              </div>

              <div id="dither-controls" style="display: none;" class="dither-controls-grid">
                <div class="slider-group">
                  <label>ALGORITHM</label>
                  <select id="dither-algo-select" class="form-select">
                    <option value="floyd">Floyd-Steinberg (Smooth)</option>
                    <option value="bayer4">Bayer 4x4 (Classic Retro)</option>
                    <option value="bayer8">Bayer 8x8 (Fine Stipple)</option>
                    <option value="atkinson">Atkinson (Vintage Mac)</option>
                  </select>
                </div>

                <div class="slider-group">
                  <label>CONTRAST (<span id="val-contrast">1.15</span>)</label>
                  <input type="range" id="dither-contrast" min="0.5" max="2.5" step="0.05" value="1.15" />
                </div>

                <div class="slider-group">
                  <label>BRIGHTNESS (<span id="val-brightness">0</span>)</label>
                  <input type="range" id="dither-brightness" min="-60" max="60" step="5" value="0" />
                </div>

                <div class="slider-group" style="flex-direction: row; align-items: center; gap: 0.5rem; margin-top: 0.8rem;">
                  <input type="checkbox" id="dither-invert" />
                  <label for="dither-invert">INVERT B&W</label>
                </div>
              </div>

              <div id="dither-preview-container" class="dither-preview-box" style="display: none;">
                <!-- Processed canvas inserted here -->
              </div>

              <button type="button" class="btn-secondary" id="insert-dither-btn" style="display: none;">
                [ INSERT 1-BIT IMAGE INTO POST CONTENT ]
              </button>
            </div>

            <div class="form-group">
              <label class="form-label" for="post-content">Article Content (Markdown supported)</label>
              <textarea id="post-content" class="form-textarea" placeholder="Write your thoughts here... Use markdown headings (###), code blocks (\`\`\`), and lists (*)."></textarea>
            </div>

            <div class="admin-actions">
              <div>
                <button type="button" class="btn-danger" id="delete-post-btn" style="display: none;">
                  DELETE TICKET
                </button>
              </div>
              <div style="display: flex; gap: 0.6rem;">
                <button type="button" class="btn-secondary" id="cancel-admin-btn">
                  CANCEL
                </button>
                <button type="button" class="btn-primary" id="save-post-btn">
                  PUBLISH TICKET
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    this.modalEl = backdrop;

    this.bindEvents();
  }

  bindEvents() {
    this.modalEl.querySelector('#close-admin-btn').addEventListener('click', () => this.close());
    this.modalEl.querySelector('#cancel-admin-btn').addEventListener('click', () => this.close());

    // Unlock handler
    const unlockBtn = this.modalEl.querySelector('#auth-unlock-btn');
    const authInput = this.modalEl.querySelector('#auth-key-input');

    const handleUnlock = () => {
      const key = authInput.value.trim();
      if (!key) return;
      this.setAdminKey(key);
      this.modalEl.querySelector('#admin-auth-section').style.display = 'none';
      this.modalEl.querySelector('#admin-form-section').style.display = 'flex';
      this.populateForm(this.currentPost);
    };

    unlockBtn.addEventListener('click', handleUnlock);
    authInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUnlock();
    });

    // Save button
    this.modalEl.querySelector('#save-post-btn').addEventListener('click', () => this.handleSave());

    // Delete button
    this.modalEl.querySelector('#delete-post-btn').addEventListener('click', () => this.handleDelete());

    // Dither drop zone
    const dropZone = this.modalEl.querySelector('#dither-drop-zone');
    const fileInput = this.modalEl.querySelector('#dither-file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.loadDitherFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.loadDitherFile(e.target.files[0]);
      }
    });

    // Dither slider controls
    const algoSelect = this.modalEl.querySelector('#dither-algo-select');
    const contrastSlider = this.modalEl.querySelector('#dither-contrast');
    const brightnessSlider = this.modalEl.querySelector('#dither-brightness');
    const invertCheck = this.modalEl.querySelector('#dither-invert');

    const updateDither = () => {
      this.modalEl.querySelector('#val-contrast').textContent = contrastSlider.value;
      this.modalEl.querySelector('#val-brightness').textContent = brightnessSlider.value;
      this.processCurrentDither();
    };

    algoSelect.addEventListener('change', updateDither);
    contrastSlider.addEventListener('input', updateDither);
    brightnessSlider.addEventListener('input', updateDither);
    invertCheck.addEventListener('change', updateDither);

    // Insert dithered image button
    const insertBtn = this.modalEl.querySelector('#insert-dither-btn');
    insertBtn.addEventListener('click', async () => {
      if (!this.processedCanvas) return;
      
      const adminKey = this.getAdminKey();
      const origText = insertBtn.textContent;
      insertBtn.disabled = true;
      insertBtn.textContent = adminKey ? '[ UPLOADING TO GITHUB... ]' : '[ PROCESSING IMAGE... ]';

      try {
        const dataUrl = this.processedCanvas.toDataURL('image/png');
        const filename = `dither-${Date.now().toString(36)}.png`;
        
        let imgUrl = dataUrl;
        if (this.storage.uploadImage) {
          imgUrl = await this.storage.uploadImage(dataUrl, filename, adminKey);
        }

        const textarea = this.modalEl.querySelector('#post-content');
        const insertText = `\n![1-Bit Capture](${imgUrl})\n`;
        textarea.value += insertText;

        if (adminKey && imgUrl !== dataUrl) {
          alert(`1-Bit image uploaded directly to GitHub repository at ${imgUrl}!`);
        } else {
          alert('1-Bit image inserted into content!');
        }
      } catch (err) {
        alert(`Could not upload image to GitHub: ${err.message}`);
      } finally {
        insertBtn.disabled = false;
        insertBtn.textContent = origText;
      }
    });
  }

  loadDitherFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.sourceImage = img;
        this.modalEl.querySelector('#dither-controls').style.display = 'grid';
        this.modalEl.querySelector('#dither-preview-container').style.display = 'flex';
        this.modalEl.querySelector('#insert-dither-btn').style.display = 'inline-block';
        this.processCurrentDither();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  processCurrentDither() {
    if (!this.sourceImage) return;

    const algo = this.modalEl.querySelector('#dither-algo-select').value;
    const contrast = parseFloat(this.modalEl.querySelector('#dither-contrast').value);
    const brightness = parseFloat(this.modalEl.querySelector('#dither-brightness').value);
    const invert = this.modalEl.querySelector('#dither-invert').checked;

    this.processedCanvas = DitherEngine.processImage(this.sourceImage, {
      algorithm: algo,
      maxWidth: 420,
      contrast,
      brightness,
      invert
    });

    this.processedCanvas.className = 'dither-preview-canvas';
    const previewContainer = this.modalEl.querySelector('#dither-preview-container');
    previewContainer.innerHTML = '';
    previewContainer.appendChild(this.processedCanvas);
  }

  populateForm(post) {
    const titleInput = this.modalEl.querySelector('#post-title');
    const stationInput = this.modalEl.querySelector('#post-station');
    const stampSelect = this.modalEl.querySelector('#post-stamp');
    const tagsInput = this.modalEl.querySelector('#post-tags');
    const summaryInput = this.modalEl.querySelector('#post-summary');
    const contentInput = this.modalEl.querySelector('#post-content');
    const deleteBtn = this.modalEl.querySelector('#delete-post-btn');

    if (post) {
      titleInput.value = post.title || '';
      stationInput.value = post.station || 'TERMINAL #01';
      stampSelect.value = post.stamp || '';
      tagsInput.value = (post.tags || []).join(', ');
      summaryInput.value = post.summary || '';
      contentInput.value = post.content || '';
      deleteBtn.style.display = 'inline-block';
    } else {
      titleInput.value = '';
      stationInput.value = 'TERMINAL #01';
      stampSelect.value = 'ORIGINAL';
      tagsInput.value = '';
      summaryInput.value = '';
      contentInput.value = '';
      deleteBtn.style.display = 'none';
    }
  }

  async handleSave() {
    const title = this.modalEl.querySelector('#post-title').value.trim();
    if (!title) {
      alert('Please enter a receipt title.');
      return;
    }

    const station = this.modalEl.querySelector('#post-station').value.trim() || 'TERMINAL #01';
    const stamp = this.modalEl.querySelector('#post-stamp').value;
    const tags = this.modalEl.querySelector('#post-tags').value
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(Boolean);
    const summary = this.modalEl.querySelector('#post-summary').value.trim();
    const content = this.modalEl.querySelector('#post-content').value.trim();

    const wordCount = content ? content.split(/\s+/).length : 50;
    const readingTime = `${Math.max(1, Math.ceil(wordCount / 200))} MIN`;

    const postData = {
      ...(this.currentPost || {}),
      title,
      station,
      stamp,
      tags,
      summary,
      content,
      wordCount,
      readingTime
    };

    const saveBtn = this.modalEl.querySelector('#save-post-btn');
    const origText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'COMMITTING TO GITHUB...';

    try {
      const adminKey = this.getAdminKey();
      await this.storage.savePost(postData, adminKey);
      this.close();
      if (this.onPostSaved) this.onPostSaved(postData);
      alert('Receipt successfully published and saved to GitHub!');
    } catch (err) {
      alert(`Failed to save post to GitHub: ${err.message}`);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = origText;
    }
  }

  async handleDelete() {
    if (!this.currentPost || !confirm(`Delete "${this.currentPost.title}" permanently from your GitHub repository?`)) {
      return;
    }

    const deleteBtn = this.modalEl.querySelector('#delete-post-btn');
    const origText = deleteBtn.textContent;
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'DELETING FROM GITHUB...';

    try {
      const adminKey = this.getAdminKey();
      await this.storage.deletePost(this.currentPost.id, adminKey);
      this.close();
      if (this.onPostSaved) this.onPostSaved(null);
      alert('Receipt ticket deleted permanently from GitHub!');
    } catch (err) {
      alert(`Failed to delete post: ${err.message}`);
    } finally {
      deleteBtn.disabled = false;
      deleteBtn.textContent = origText;
    }
  }
}
