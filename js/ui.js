/* ============================================================
   BCS Verse — UI rendering layer
   ============================================================ */
(function () {
  'use strict';

  const BCS = window.BCS;
  const C = BCS.CONFIG;
  const esc = BCS.escapeHtml;
  const bn = BCS.toBn;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const UI = {
    filter: 'all',
    query: '',

    /* ---------------- Toasts ---------------- */
    toast(message, type, ms) {
      const root = $('#toasts');
      if (!root) return;
      const el = document.createElement('div');
      const icons = { ok: '✅', err: '⚠️', info: 'ℹ️' };
      el.className = 'toast ' + (type || 'info');
      el.innerHTML = `<span class="t-ico">${icons[type] || 'ℹ️'}</span><span>${esc(message)}</span>`;
      root.appendChild(el);
      setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 300);
      }, ms || 3400);
    },

    /* ---------------- Modal ---------------- */
    modal: {
      _escHandler: null,
      open(opts) {
        const root = $('#modalRoot');
        const o = opts || {};
        root.innerHTML = `
          <div class="modal-backdrop" data-close="1"></div>
          <div class="modal" role="dialog" aria-modal="true" style="${o.width ? 'width:min(94vw,' + o.width + ')' : ''}">
            <div class="modal-head">
              <h3>${o.title || ''}</h3>
              <button class="x-btn" data-close="1" aria-label="বন্ধ করুন">
                <svg class="ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="modal-body">${o.body || ''}</div>
            ${o.footer ? `<div class="modal-foot">${o.footer}</div>` : ''}
          </div>`;
        root.classList.add('open');
        root.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        root.querySelectorAll('[data-close]').forEach((el) => {
          el.addEventListener('click', () => UI.modal.close());
        });

        this._escHandler = (e) => { if (e.key === 'Escape') UI.modal.close(); };
        document.addEventListener('keydown', this._escHandler);

        if (typeof o.onMount === 'function') o.onMount(root.querySelector('.modal-body'), root);
        const focusTarget = root.querySelector('input,textarea,select,button.btn');
        if (focusTarget && o.autofocus !== false) setTimeout(() => focusTarget.focus(), 60);
        return root;
      },
      close() {
        const root = $('#modalRoot');
        root.classList.remove('open');
        root.setAttribute('aria-hidden', 'true');
        root.innerHTML = '';
        document.body.style.overflow = '';
        if (this._escHandler) document.removeEventListener('keydown', this._escHandler);
        this._escHandler = null;
      },
      isOpen() {
        return $('#modalRoot').classList.contains('open');
      }
    },

    /* ---------------- Live strip ---------------- */
    renderLiveStrip(state) {
      const wrap = $('#liveStrip');
      const count = $('#liveCount');
      const users = state.live || [];

      const totalBase = 1387;
      const total = totalBase + users.length + (state.user ? 1 : 0);
      if (count) count.textContent = bn(total.toLocaleString('en-US')) + ' জন এখন পড়ছেন';

      if (!users.length) {
        wrap.innerHTML = `<div class="empty" style="padding:26px;width:100%">
            <div class="em-ico">🌙</div><h3>এখন কেউ লাইভে নেই</h3>
            <p>প্রথম লাইভ সেশন শুরু করে অন্যদের অনুপ্রাণিত করুন!</p></div>`;
        return;
      }

      wrap.innerHTML = users
        .map((u, i) => `
        <div class="live-card" style="animation-delay:${i * 45}ms">
          <div class="lc-top">
            ${BCS.avatarHtml(u.name, 'sm')}
            <div style="min-width:0">
              <div class="lc-name">${esc(u.name)}${u.isMe ? ' <span class="chip chip-green" style="font-size:.6rem;padding:1px 6px">আপনি</span>' : ''}</div>
              <div class="lc-target">${esc(u.target || 'বিসিএস পরীক্ষার্থী')}</div>
            </div>
          </div>
          <div class="lc-subject">📖 ${esc(u.subject)}</div>
          <div class="lc-time"><span class="pulse-dot"></span> ${bn(u.minutes || 1)} মিনিট ধরে লাইভ</div>
        </div>`)
        .join('');
    },

    /* ---------------- Focus timer ---------------- */
    renderFocus(state) {
      const display = $('#focusDisplay');
      const ring = $('#ringProgress');
      const sub = $('#focusSub');
      const status = $('#focusStatus');
      const btn = $('#focusBtn');
      const endBtn = $('#endBtn');
      const meta = $('#focusMeta');
      const sel = $('#focusSubject');

      const s = state.session;
      const secs = s ? s.elapsed : 0;

      if (display) display.textContent = BCS.formatClock(secs);

      const circ = 540.35;
      const progress = BCS.clamp(secs / (C.MINUTES_PER_RING * 60), 0, 1);
      if (ring) ring.style.strokeDashoffset = String(circ * (1 - progress));

      if (!s) {
        if (sub) sub.textContent = 'সেশন শুরু করুন';
        if (status) { status.textContent = 'প্রস্তুত'; status.className = 'chip chip-green'; }
        if (btn) { btn.innerHTML = '▶ শুরু করুন'; btn.classList.remove('pulsing'); btn.disabled = false; }
        if (endBtn) endBtn.disabled = true;
        if (sel) sel.disabled = false;
        if (meta) meta.textContent = '';
      } else {
        if (sub) sub.textContent = s.subject;
        if (s.running) {
          if (status) { status.textContent = 'লাইভ'; status.className = 'chip chip-red'; }
          if (btn) { btn.innerHTML = '⏸ বিরতি'; btn.classList.add('pulsing'); btn.disabled = false; }
        } else {
          if (status) { status.textContent = 'বিরতিতে'; status.className = 'chip chip-amber'; }
          if (btn) { btn.innerHTML = '▶ চালু করুন'; btn.classList.remove('pulsing'); btn.disabled = false; }
        }
        if (endBtn) endBtn.disabled = false;
        if (sel) { sel.disabled = true; sel.value = s.subject; }
        if (meta) meta.textContent = 'শুরু: ' + new Date(s.startedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
      }
    },

    /* ---------------- Feed ---------------- */
    applyFilter(posts, state) {
      let list = posts.slice();
      const me = state.user && state.user.username;

      if (this.filter === 'live') list = list.filter((p) => p.live);
      else if (this.filter === 'mine') list = list.filter((p) => p.username === me);
      else if (this.filter === 'saved') list = list.filter((p) => (p.saves || []).includes(me));

      const q = this.query.trim().toLowerCase();
      if (q) {
        list = list.filter((p) =>
          (p.content || '').toLowerCase().includes(q) ||
          (p.author || '').toLowerCase().includes(q) ||
          (p.username || '').toLowerCase().includes(q)
        );
      }
      return list;
    },

    renderFeed(state) {
      const feed = $('#feed');
      const list = this.applyFilter(state.posts || [], state);
      const me = state.user && state.user.username;

      if (!list.length) {
        const msgs = {
          all: ['📭', 'এখনো কোনো পোস্ট নেই', 'প্রথম পোস্টটি আপনিই করুন!'],
          live: ['🔴', 'কোনো লাইভ পোস্ট নেই', 'লাইভ সেশন শুরু করলে এখানে দেখা যাবে।'],
          mine: ['✍️', 'আপনার কোনো পোস্ট নেই', 'উপরের বক্স থেকে লিখুন।'],
          saved: ['🔖', 'সেভ করা পোস্ট নেই', 'পোস্টের সেভ বাটনে ক্লিক করে রাখুন।']
        };
        const m = msgs[this.filter] || msgs.all;
        feed.innerHTML = `<div class="empty"><div class="em-ico">${m[0]}</div><h3>${m[1]}</h3><p>${m[2]}</p></div>`;
        return;
      }

      feed.innerHTML = list.map((p, i) => this.postHtml(p, state, me, i)).join('');
    },

    postHtml(p, state, me, index) {
      const liked = me && (p.likes || []).includes(me);
      const saved = me && (p.saves || []).includes(me);
      const isMine = me && p.username === me;
      const comments = p.comments || [];

      return `
      <article class="card post" data-post="${p.id}" style="animation-delay:${Math.min(index * 40, 240)}ms">
        <div class="post-head">
          <div class="post-author">
            ${p.live ? `<div class="av-ring">${BCS.avatarHtml(p.author, 'md')}</div>` : BCS.avatarHtml(p.author, 'md')}
            <div style="min-width:0">
              <div class="pa-name">
                ${esc(p.author)}
                ${p.isBot ? '<span class="badge bot">AI</span>' : '<span class="badge">BCS 51</span>'}
                ${p.live ? '<span class="pulse-dot" title="লাইভ স্টাডি করছেন"></span>' : ''}
              </div>
              <div class="pa-meta">@${esc(p.username)} • ${BCS.relTime(p.ts)}</div>
            </div>
          </div>
          <button class="post-menu" data-action="post-menu" data-id="${p.id}" aria-label="মেনু">
            <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
          </button>
        </div>

        <div class="post-body">${BCS.richText(p.content)}</div>

        <div class="post-actions">
          <button class="act ${liked ? 'liked' : ''}" data-action="like" data-id="${p.id}">
            <svg class="ic sm" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}"><path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 7.7a4.2 4.2 0 0 1 7 3c0 4.9-7 9.3-7 9.3Z"/></svg>
            ${bn((p.likes || []).length)} লাইক
          </button>
          <button class="act" data-action="toggle-comments" data-id="${p.id}">
            <svg class="ic sm" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.2A8 8 0 1 1 21 12Z"/></svg>
            ${bn(comments.length)} কমেন্ট
          </button>
          <button class="act ${saved ? 'saved' : ''}" data-action="save" data-id="${p.id}">
            <svg class="ic sm" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}"><path d="M6 4h12v16l-6-4-6 4V4Z"/></svg>
            ${saved ? 'সেভড' : 'সেভ'}
          </button>
          <button class="act" data-action="share" data-id="${p.id}">
            <svg class="ic sm" viewBox="0 0 24 24"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v12M8 7l4-4 4 4"/></svg>
            শেয়ার
          </button>
          ${isMine ? `<button class="act danger" data-action="delete" data-id="${p.id}">
            <svg class="ic sm" viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>
            মুছুন
          </button>` : ''}
        </div>

        <div class="comments" id="cmt-${p.id}">
          ${comments.map((c) => `
            <div class="cmt">
              ${BCS.avatarHtml(c.author, 'xs')}
              <div class="cmt-bubble">
                <div class="cmt-name">${esc(c.author)} <span class="muted" style="font-weight:500;font-size:.72rem">• ${BCS.relTime(c.ts)}</span></div>
                <div class="cmt-text">${esc(c.text)}</div>
              </div>
            </div>`).join('')}
          <div class="cmt-form">
            ${BCS.avatarHtml(state.user ? state.user.name : '?', 'xs')}
            <input class="input" data-cmt-input="${p.id}" placeholder="একটি কমেন্ট লিখুন…" maxlength="${C.MAX_COMMENT_LEN}" />
            <button class="btn btn-grad sm" data-action="add-comment" data-id="${p.id}">পাঠান</button>
          </div>
        </div>
      </article>`;
    },

    /* ---------------- Right rail ---------------- */
    renderStats(state) {
      const s = state.stats || {};
      $('#statStreak').textContent = bn(s.streak || 0);
      $('#statHours').textContent = bn(Math.floor((s.totalMinutes || 0) / 60));
      $('#statSessions').textContent = bn(s.sessions || 0);
      $('#statPosts').textContent = bn(BCS.Store.userPosts().length);
    },

    renderLeaderboard(state) {
      const rows = BCS.Store.leaderboard();
      const el = $('#leaderboard');
      const me = state.user && state.user.username;

      if (!rows.length) {
        el.innerHTML = '<p class="muted sm">এখনো কোনো তথ্য নেই।</p>';
        return;
      }

      el.innerHTML = rows.map((r, i) => `
        <div class="lb-row ${r.username === me ? 'me' : ''}">
          <span class="lb-rank ${i === 0 ? 'g1' : i === 1 ? 'g2' : i === 2 ? 'g3' : ''}">${bn(i + 1)}</span>
          ${BCS.avatarHtml(r.name, 'xs')}
          <span class="lb-name">${esc(r.name)}</span>
          <span class="lb-time">${BCS.formatMinutes(r.minutes)}</span>
        </div>`).join('');
    },

    renderTopics() {
      const el = $('#topicList');
      el.innerHTML = BCS.SUBJECTS.map(
        (s) => `<span class="tag" data-action="topic" data-tag="${esc(s.name)}">${s.emoji} ${esc(s.name)}</span>`
      ).join('');
    },

    renderQuickTags() {
      const el = $('#quickTags');
      const picks = BCS.SUBJECTS.slice(0, 5);
      el.innerHTML = picks
        .map((s) => `<span class="tag" data-action="insert-tag" data-tag="${esc(s.name.replace(/\s+/g, '_'))}">#${esc(s.name.split(' ')[0])}</span>`)
        .join('');
    },

    renderSubjectSelect() {
      const sel = $('#focusSubject');
      if (!sel) return;
      sel.innerHTML = BCS.SUBJECTS.map(
        (s) => `<option value="${esc(s.name)}">${s.emoji} ${esc(s.name)}</option>`
      ).join('');
      if (BCS.Store.state.session) sel.value = BCS.Store.state.session.subject;
    },

    /* ---------------- Sidebar / profile ---------------- */
    renderSidebar(state) {
      const name = state.user ? state.user.name : 'অতিথি পরীক্ষার্থী';
      const handle = state.user ? '@' + state.user.username : '@aspirant';

      const sideName = $('#sideName');
      const sideHandle = $('#sideHandle');
      const sideAvatar = $('#sideAvatar');
      const authBtn = $('#sideAuthBtn');

      if (sideName) sideName.textContent = name;
      if (sideHandle) sideHandle.textContent = handle;
      if (sideAvatar) {
        if (state.user) {
          const a = BCS.avatar(state.user.name, 'md');
          sideAvatar.textContent = a.initials;
          sideAvatar.style.background = a.bg.replace('background:', '');
          sideAvatar.style.borderRadius = '18px';
        } else {
          sideAvatar.textContent = '🎯';
          sideAvatar.style.background = '';
        }
      }
      if (authBtn) {
        authBtn.textContent = state.user ? 'লগআউট' : 'অ্যাকাউন্ট খুলুন';
        authBtn.dataset.action = state.user ? 'signout' : 'auth';
      }

      const dot = $('#navLiveDot');
      if (dot) dot.classList.toggle('on', BCS.Store.isLiveNow());
    },

    updateAIChip() {
      const chip = $('#aiStatusChip');
      if (!chip) return;
      const key = BCS.Store.getApiKey();
      if (!key) {
        chip.textContent = 'Key নেই';
        chip.className = 'chip chip-amber';
      } else {
        chip.textContent = 'প্রস্তুত';
        chip.className = 'chip chip-green';
      }
      const badge = $('#modelBadge');
      if (badge) badge.textContent = BCS.Store.getModel();
    },

    /* ---------------- Master render ---------------- */
    renderAll(state) {
      this.renderLiveStrip(state);
      this.renderFocus(state);
      this.renderFeed(state);
      this.renderStats(state);
      this.renderLeaderboard(state);
      this.renderSidebar(state);
      this.updateAIChip();
    }
  };

  BCS.UI = UI;
})();
