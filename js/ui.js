/* =========================================================
   BCS Verse — UI helpers (toast, modal, format)
   ========================================================= */
(function () {
  'use strict';

  const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];

  const UI = {
    /** Convert digits in a string/number to Bengali numerals */
    bn(n) {
      return String(n).replace(/\d/g, d => BN_DIGITS[+d]);
    },

    /** Format time ago in Bengali */
    timeAgo(ts) {
      const diff = Date.now() - ts;
      const m = Math.floor(diff / 60000);
      if (m < 1) return 'এইমাত্র';
      if (m < 60) return UI.bn(m) + ' মিনিট আগে';
      const h = Math.floor(m / 60);
      if (h < 24) return UI.bn(h) + ' ঘণ্টা আগে';
      const d = Math.floor(h / 24);
      if (d < 7) return UI.bn(d) + ' দিন আগে';
      return UI.bn(Math.floor(d / 7)) + ' সপ্তাহ আগে';
    },

    /** HH:MM:SS in Bengali */
    clock(totalSeconds) {
      const s = Math.max(0, Math.floor(totalSeconds));
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      return UI.bn(h + ':' + m + ':' + ss);
    },

    /** Escape HTML for safe insertion */
    esc(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /** Render **bold** and `code` markers */
    rich(str) {
      let out = UI.esc(str);
      out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      out = out.replace(/`([^`]+?)`/g, '<code>$1</code>');
      return out;
    },

    toast(message, type) {
      const root = document.getElementById('toasts');
      if (!root) return;
      const icons = { ok: '✅', err: '⚠️', info: 'ℹ️' };
      const kind = type || 'info';
      const el = document.createElement('div');
      el.className = 'toast ' + kind;
      el.innerHTML = '<span>' + (icons[kind] || '') + '</span><span>' + UI.esc(message) + '</span>';
      root.appendChild(el);
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 320);
      }, 3600);
    },

    modal(html) {
      const root = document.getElementById('modalRoot');
      if (!root) return;
      root.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true">' +
        '<div class="modal-head"><div class="modal-title"></div>' +
        '<button class="modal-close" aria-label="বন্ধ">✕</button></div>' +
        '<div class="modal-body"></div></div>';
      root.classList.add('open');
      root.setAttribute('aria-hidden', 'false');

      const close = () => UI.closeModal();
      root.querySelector('.modal-close').addEventListener('click', close);
      root.addEventListener('click', e => { if (e.target === root) close(); });

      const body = root.querySelector('.modal-body');
      if (typeof html === 'string') body.innerHTML = html;
      else if (html instanceof Node) body.appendChild(html);

      return { root, body, close };
    },

    modalTitle(text) {
      const t = document.querySelector('.modal-title');
      if (t) t.textContent = text;
    },

    closeModal() {
      const root = document.getElementById('modalRoot');
      if (!root) return;
      root.classList.remove('open');
      root.setAttribute('aria-hidden', 'true');
      setTimeout(() => { if (!root.classList.contains('open')) root.innerHTML = ''; }, 220);
    },

    debounce(fn, ms) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms || 220);
      };
    }
  };

  window.UI = UI;
})();
