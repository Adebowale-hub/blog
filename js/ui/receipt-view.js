/**
 * RECEIPT VIEW RENDERER
 * Handles rendering the feed, individual receipt articles, tear-off animations,
 * barcodes, and optional Web Audio thermal printer sound effects.
 */

import { BarcodeGenerator } from '../barcode.js';

export class ReceiptView {
  constructor() {
    this.soundEnabled = localStorage.getItem('receipt_sound_enabled') === 'true';
    this.audioCtx = null;
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('receipt_sound_enabled', this.soundEnabled);
    return this.soundEnabled;
  }

  /**
   * Synthesize an authentic thermal receipt printer sound using Web Audio API
   */
  playPrinterSound() {
    if (!this.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;

      // 1. Motor hum (low frequency modulated square/sawtooth)
      const motorOsc = this.audioCtx.createOscillator();
      const motorGain = this.audioCtx.createGain();
      motorOsc.type = 'sawtooth';
      motorOsc.frequency.setValueAtTime(110, now);
      motorOsc.frequency.exponentialRampToValueAtTime(130, now + 0.35);

      motorGain.gain.setValueAtTime(0.04, now);
      motorGain.gain.linearRampToValueAtTime(0.06, now + 0.1);
      motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      motorOsc.connect(motorGain);
      motorGain.connect(this.audioCtx.destination);

      motorOsc.start(now);
      motorOsc.stop(now + 0.45);

      // 2. Thermal head paper friction (white noise burst)
      const bufferSize = this.audioCtx.sampleRate * 0.4;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(2.5, now);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.06, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.4);
    } catch {
      // Audio autoplay policy or not supported
    }
  }

  /**
   * Render feed of receipt slips
   */
  renderFeed(posts, containerEl, onSelectPost) {
    containerEl.innerHTML = '';

    if (!posts || posts.length === 0) {
      containerEl.innerHTML = `
        <div class="receipt-wrapper animate-feed">
          <div class="receipt-ticket">
            <div class="receipt-header">
              <div class="store-brand">THERMAL LOG</div>
              <div class="store-tagline">*** ROLL STATUS: READY ***</div>
              <div class="receipt-meta-grid">
                <div>STATION: TERMINAL #01</div>
                <div>SLIP #: 000000</div>
                <div>STATUS: EMPTY ROLL</div>
                <div>STORAGE: GITHUB CLOUD</div>
              </div>
            </div>
            <div class="receipt-divider">================================</div>
            <div class="receipt-content" style="text-align: center; padding: 1.8rem 0;">
              <p style="font-size: 1rem; font-weight: 700; text-transform: uppercase;">NO DISPATCHES RECORDED YET</p>
              <p style="font-size: 0.8rem; color: var(--ink-secondary); margin-top: 0.5rem; line-height: 1.5;">
                The thermal paper roll is clean and waiting for your first dispatch.
              </p>
              <button class="icon-btn" id="empty-new-btn" style="margin-top: 1.2rem; padding: 0.5rem 1rem; font-size: 0.8rem;">
                [ + WRITE YOUR FIRST RECEIPT ]
              </button>
            </div>
            <div class="receipt-divider">--------------------------------</div>
            <div class="receipt-farewell">
              *** PRESS [ + NEW ] OR CTRL+SHIFT+A TO COMPOSE ***
            </div>
          </div>
        </div>
      `;

      containerEl.querySelector('#empty-new-btn')?.addEventListener('click', () => {
        document.getElementById('new-post-btn')?.click();
      });
      return;
    }

    this.playPrinterSound();

    posts.forEach((post, index) => {
      const wrapper = document.createElement('article');
      wrapper.className = 'receipt-wrapper animate-feed';
      wrapper.style.animationDelay = `${index * 0.08}s`;

      const barcodeHtml = BarcodeGenerator.generateSVG(post.id || post.slipNumber, 200, 36);
      const tagChips = (post.tags || []).map(t => `<span class="tag-chip">#${t}</span>`).join(' ');

      const itemsRows = (post.items || []).slice(0, 3).map(item => `
        <tr>
          <td class="col-qty">${item.qty}</td>
          <td>${item.name}</td>
          <td class="col-price">${item.price}</td>
        </tr>
      `).join('');

      wrapper.innerHTML = `
        <div class="receipt-ticket">
          ${post.stamp ? `<div class="retro-stamp ${post.stamp.toLowerCase()}">${post.stamp}</div>` : ''}
          
          <div class="receipt-header">
            <div class="store-brand">PERSONAL DISPATCH</div>
            <div class="store-tagline">*** 1-BIT THERMAL LOG ***</div>
            <div class="receipt-meta-grid">
              <div>STATION: ${post.station || 'TERMINAL #01'}</div>
              <div>SLIP #: ${post.slipNumber || '000000'}</div>
              <div>DATE: ${post.date}</div>
              <div>TIME: ${post.time}</div>
            </div>
          </div>

          <h2 class="receipt-title">
            <a href="#post/${post.id}">${post.title}</a>
          </h2>

          <div class="receipt-divider">--------------------------------</div>

          <p class="receipt-summary" style="font-size: 0.88rem; line-height: 1.5; margin-bottom: 0.8rem;">
            ${post.summary || ''}
          </p>

          ${itemsRows ? `
            <table class="itemized-table">
              <thead>
                <tr>
                  <th class="col-qty">QTY</th>
                  <th>TAKEAWAY / SECTION</th>
                  <th class="col-price">STATUS</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
            </table>
          ` : ''}

          <div class="tag-cloud" style="margin: 0.8rem 0;">
            ${tagChips}
          </div>

          <div class="receipt-totals">
            <div class="totals-row">
              <span>READ TIME</span>
              <span>${post.readingTime || '3 MIN'}</span>
            </div>
            <div class="totals-row">
              <span>WORD COUNT</span>
              <span>${post.wordCount || '400'} WORDS</span>
            </div>
            <div class="totals-row grand-total">
              <span>TOTAL VALUE</span>
              <span>PRICELESS</span>
            </div>
          </div>

          <div class="receipt-barcode-wrap">
            ${barcodeHtml}
            <div class="barcode-digits">* ${post.slipNumber || post.id} *</div>
          </div>

          <div class="receipt-farewell">
            *** THANK YOU FOR READING - VISIT AGAIN ***
          </div>

          <div class="receipt-actions">
            <button class="icon-btn read-btn" data-id="${post.id}">
              [ OPEN FULL TICKET ]
            </button>
            <button class="icon-btn print-slip-btn" data-id="${post.id}">
              PRINT SLIP
            </button>
          </div>
        </div>
      `;

      // Event handlers
      wrapper.querySelector('.read-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        onSelectPost(post.id);
      });

      wrapper.querySelector('.receipt-title a')?.addEventListener('click', (e) => {
        e.preventDefault();
        onSelectPost(post.id);
      });

      wrapper.querySelector('.print-slip-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.print();
      });

      containerEl.appendChild(wrapper);
    });
  }

  /**
   * Render single full receipt post
   */
  renderSinglePost(post, containerEl, onBack, onEdit) {
    containerEl.innerHTML = '';
    this.playPrinterSound();

    const wrapper = document.createElement('article');
    wrapper.className = 'receipt-wrapper animate-feed';

    const barcodeHtml = BarcodeGenerator.generateSVG(post.id, 240, 44);
    const tagChips = (post.tags || []).map(t => `<span class="tag-chip">#${t}</span>`).join(' ');

    const itemsRows = (post.items || []).map(item => `
      <tr>
        <td class="col-qty">${item.qty}</td>
        <td>${item.name}</td>
        <td class="col-price">${item.price}</td>
      </tr>
    `).join('');

    // Format content with basic markdown support (paragraphs, headings, code, blockquotes)
    const formattedContent = this.formatMarkdown(post.content || '');

    wrapper.innerHTML = `
      <a href="#" class="back-btn" id="back-to-feed-btn">
        &larr; [ BACK TO CONTINUOUS ROLL ]
      </a>

      <div class="receipt-ticket">
        ${post.stamp ? `<div class="retro-stamp ${post.stamp.toLowerCase()}">${post.stamp}</div>` : ''}

        <div class="receipt-header">
          <div class="store-brand">PERSONAL DISPATCH</div>
          <div class="store-tagline">*** OFFICIAL READ-ONLY RECEIPT ***</div>
          <div class="receipt-meta-grid">
            <div>STATION: ${post.station || 'TERMINAL #01'}</div>
            <div>SLIP #: ${post.slipNumber || '000000'}</div>
            <div>DATE: ${post.date}</div>
            <div>TIME: ${post.time}</div>
            <div>AUTHOR: ${post.author || 'USER'}</div>
            <div>STATUS: VERIFIED</div>
          </div>
        </div>

        <h1 class="receipt-title">${post.title}</h1>
        <div class="receipt-divider">================================</div>

        ${post.summary ? `
          <div style="font-family: var(--font-mono); font-size: 0.85rem; padding: 0.6rem; border: 1px dashed var(--ink); margin-bottom: 1.2rem; background: var(--paper-shade);">
            <strong>MEMO:</strong> ${post.summary}
          </div>
        ` : ''}

        ${itemsRows ? `
          <table class="itemized-table">
            <thead>
              <tr>
                <th class="col-qty">QTY</th>
                <th>ITEMIZED KEY TAKEAWAYS</th>
                <th class="col-price">STATUS</th>
              </tr>
            </thead>
            <tbody>${itemsRows}</tbody>
          </table>
          <div class="receipt-divider">--------------------------------</div>
        ` : ''}

        <div class="receipt-content">
          ${formattedContent}
        </div>

        <div class="tag-cloud" style="margin: 1.2rem 0;">
          ${tagChips}
        </div>

        <div class="receipt-totals">
          <div class="totals-row">
            <span>READING TIME</span>
            <span>${post.readingTime || '3 MIN'}</span>
          </div>
          <div class="totals-row">
            <span>EST. WORDS</span>
            <span>${post.wordCount || '500'}</span>
          </div>
          <div class="totals-row">
            <span>TAX (VAT)</span>
            <span>0.00%</span>
          </div>
          <div class="totals-row grand-total">
            <span>TOTAL DUE</span>
            <span>0.00 USD (FREE DISPATCH)</span>
          </div>
        </div>

        <div class="receipt-barcode-wrap">
          ${barcodeHtml}
          <div class="barcode-digits">* ${post.id.toUpperCase()} *</div>
        </div>

        <div class="receipt-farewell">
          *** THANK YOU FOR VISITING ***<br>
          ALL RIGHTS RESERVED &bull; READ-ONLY RECORD
        </div>

        <div class="receipt-actions">
          <button class="icon-btn" id="print-post-btn">
            PRINT RECEIPT
          </button>
          <button class="icon-btn" id="share-post-btn">
            COPY PERMALINK
          </button>
          ${onEdit ? `
            <button class="icon-btn" id="edit-post-btn" style="border-style: dashed;">
              EDIT (OWNER)
            </button>
          ` : ''}
        </div>
      </div>
    `;

    wrapper.querySelector('#back-to-feed-btn').addEventListener('click', (e) => {
      e.preventDefault();
      onBack();
    });

    wrapper.querySelector('#print-post-btn').addEventListener('click', () => {
      window.print();
    });

    wrapper.querySelector('#share-post-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      alert('Permalink copied to clipboard!');
    });

    if (onEdit && wrapper.querySelector('#edit-post-btn')) {
      wrapper.querySelector('#edit-post-btn').addEventListener('click', () => {
        onEdit(post);
      });
    }

    containerEl.appendChild(wrapper);
  }

  /**
   * Lightweight markdown-to-HTML parser for receipt articles
   */
  formatMarkdown(text) {
    if (!text) return '';

    // Handle code blocks
    let html = text.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // Handle inline code
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      return `<code>${this.escapeHtml(code)}</code>`;
    });

    // Handle blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Handle headers
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-family: var(--font-mono); margin: 1rem 0 0.4rem 0; text-transform: uppercase;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="font-family: var(--font-mono); margin: 1.2rem 0 0.5rem 0; text-transform: uppercase;">$1</h2>');

    // Handle images (support dithered images and standard markdown images)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      return `
        <div class="dither-image-wrap">
          <img src="${src}" alt="${alt}" class="dither-canvas" />
          <div class="dither-caption">
            <span>${alt || '1-BIT THERMAL CAPTURE'}</span>
            <span class="dither-badge">1-BIT DITHER</span>
          </div>
        </div>
      `;
    });

    // Handle unordered lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Handle paragraphs (double newline)
    const paragraphs = html.split(/\n\s*\n/);
    return paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<pre>') || p.startsWith('<h') || p.startsWith('<blockquote>') || p.startsWith('<ul>') || p.startsWith('<div')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
