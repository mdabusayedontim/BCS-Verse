/* =========================================================
   BCS Verse — App bootstrap & page controllers
   ========================================================= */
(function () {
  'use strict';

  const C = window.BCS;
  const S = window.Store;
  const U = window.UI;
  const A = window.AI;

  /* ---------------------------------------------------------
     Global: theme, header, ticker
     --------------------------------------------------------- */
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#070a12' : '#f5f6fb');
  }

  function initTheme() {
    applyTheme(S.get_path('settings.theme', 'dark'));
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        S.setTheme(next);
        applyTheme(next);
        U.toast(next === 'dark' ? 'ডার্ক থিম চালু' : 'লাইট থিম চালু', 'info');
      });
    });
  }

  function initBurger() {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('mainnav');
    if (!burger || !nav) return;
    burger.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  function initGlobalKeys() {
    document.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

      if (e.key === 'Escape') { U.closeModal(); return; }
      if (typing) return;

      if (e.key === 'g' || e.key === 'G') { window.location.href = 'index.html'; }
      if (e.key === 'l' || e.key === 'L') { window.location.href = 'live.html'; }
      if (e.key === 'a' || e.key === 'A') { window.location.href = 'ai.html'; }
      if (e.key === 'p' || e.key === 'P') { window.location.href = 'profile.html'; }
    });
  }

  function renderSidebar() {
    const u = S.get().user;
    const map = {
      sideAvatar: u.avatar,
      sideName: u.name,
      sideHandle: u.handle,
      headerAvatar: u.avatar
    };
    for (const id in map) {
      const el = document.getElementById(id);
      if (el) {
        if (el.tagName === 'IMG') el.src = map[id];
        else el.textContent = map[id];
      }
    }

    const auth = document.getElementById('sideAuthBtn');
    if (auth) {
      const isGuest = u.name === 'অতিথি পরীক্ষার্থী';
      auth.textContent = isGuest ? 'অ্যাকাউন্ট খুলুন' : 'প্রোফাইল দেখুন';
      auth.onclick = () => {
        if (isGuest) openAuthModal();
        else window.location.href = 'profile.html';
      };
    }
  }

  function renderStats() {
    const s = S.get().stats;
    const map = {
      statStreak: U.bn(s.streak || 0),
      statHours: U.bn(s.hours || 0),
      statSessions: U.bn(s.sessions || 0),
      statPosts: U.bn(s.posts || 0)
    };
    for (const id in map) {
      const el = document.getElementById(id);
      if (el) el.textContent = map[id];
    }
  }

  function renderLeaderboard() {
    const el = document.getElementById('leaderboard');
    if (!el) return;
    const rows = S.get().leaderboard || [];
    el.innerHTML = rows.map((r, i) =>
      '<div class="lb-row">' +
        '<div class="lb-rank">' + U.bn(i + 1) + '</div>' +
        '<div class="lb-av">' + U.esc(r.avatar) + '</div>' +
        '<div class="lb-name">' + U.esc(r.name) + '</div>' +
        '<div class="lb-val">' + U.bn(r.hours) + ' ঘ</div>' +
      '</div>'
    ).join('');
  }

  function renderTopics() {
    const el = document.getElementById('topicList');
    if (!el) return;
    el.innerHTML = C.SUBJECTS.slice(0, 6).map(s =>
      '<div class="topic-row" data-topic="' + s.id + '">' +
        '<span class="topic-ico">' + s.icon + '</span>' +
        '<span class="topic-name">' + U.esc(s.name) + '</span>' +
        '<span class="topic-count">' + U.bn(Math.floor(Math.random() * 60) + 12) + '</span>' +
      '</div>'
    ).join('');
    el.querySelectorAll('.topic-row').forEach(r => {
      r.addEventListener('click', () => {
        window.location.href = 'index.html?topic=' + r.dataset.topic;
      });
    });
  }

  function renderLiveStrip() {
    const el = document.getElementById('liveStrip');
    const count = document.getElementById('liveCount');
    if (!el) return;
    const live = S.get().live || [];
    const total = live.reduce((a, b) => a + 1, 0) + 128;
    if (count) count.textContent = U.bn(total) + ' জন এখন পড়ছেন';

    el.innerHTML = live.map(l => {
      const subj = C.subjectById(l.subject);
      return '<div class="live-card" data-room="' + l.id + '">' +
        '<div class="live-card-top">' +
          '<div class="live-card-av">' + l.avatar + '</div>' +
          '<div><div class="live-card-name">' + U.esc(l.user) + '</div>' +
          '<div class="live-card-sub"><span class="pulse-dot" style="width:5px;height:5px"></span> লাইভ</div></div>' +
        '</div>' +
        '<div class="live-card-subj">' + subj.icon + ' ' + U.esc(subj.name) + '</div>' +
        '<div class="live-card-time"><span>' + U.esc(l.label) + '</span><span>' + U.bn(l.minutes) + ' মি</span></div>' +
      '</div>';
    }).join('');

    el.querySelectorAll('.live-card').forEach(c => {
      c.addEventListener('click', () => { window.location.href = 'live.html'; });
    });
  }

  function renderLiveDot() {
    // small red dot on nav links pointing to live.html
    document.querySelectorAll('[data-live-dot]').forEach(d => {
      d.style.display = (S.get().live || []).length ? '' : 'none';
    });
  }

  function initSettingsAction() {
    document.querySelectorAll('[data-action="open-settings"]').forEach(btn => {
      btn.addEventListener('click', openSettingsModal);
    });
    document.querySelectorAll('[data-action="open-ai-settings"]').forEach(btn => {
      btn.addEventListener('click', openSettingsModal);
    });
  }

  function openSettingsModal() {
    const s = S.get().settings;
    const html =
      '<div class="settings-grid">' +
        '<div class="setting setting-full">' +
          '<label class="lbl" for="mKey">Gemini API Key</label>' +
          '<input id="mKey" class="input" type="password" placeholder="AIza…" value="' + U.esc(s.apiKey || '') + '" />' +
          '<p class="muted xs mt-8">Key শুধু আপনার ব্রাউজারে সংরক্ষিত হয়। <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--brand)">AI Studio</a> থেকে বিনামূল্যে নিন।</p>' +
        '</div>' +
        '<div class="setting">' +
          '<label class="lbl" for="mModel">মডেল</label>' +
          '<select id="mModel" class="input">' +
            C.GEMINI_MODELS.map(m => '<option value="' + m.id + '"' + (s.model === m.id ? ' selected' : '') + '>' + m.name + '</option>').join('') +
          '</select>' +
        '</div>' +
        '<div class="setting">' +
          '<label class="lbl" for="mTheme">থিম</label>' +
          '<select id="mTheme" class="input">' +
            '<option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>ডার্ক</option>' +
            '<option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>লাইট</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="row gap wrap mt-16">' +
        '<button class="btn btn-grad" id="mSave">সেভ করুন</button>' +
        '<button class="btn btn-ghost" id="mVerify">🔍 Key যাচাই</button>' +
        '<button class="btn btn-ghost" id="mExport">⬇️ ডেটা এক্সপোর্ট</button>' +
        '<button class="btn btn-ghost" id="mReset">🗑️ রিসেট</button>' +
      '</div>' +
      '<p class="muted xs mt-12" id="mStatus"></p>';

    U.modal(html);
    U.modalTitle('⚙️ সেটিংস');

    const body = document.querySelector('.modal-body');
    const status = body.querySelector('#mStatus');

    body.querySelector('#mSave').onclick = () => {
      S.patch({ settings: {
        apiKey: body.querySelector('#mKey').value.trim(),
        model: body.querySelector('#mModel').value,
        theme: body.querySelector('#mTheme').value
      }});
      applyTheme(body.querySelector('#mTheme').value);
      U.toast('সেটিংস সংরক্ষিত', 'ok');
      status.textContent = 'সংরক্ষিত ✓';
    };

    body.querySelector('#mVerify').onclick = async () => {
      S.set('settings.apiKey', body.querySelector('#mKey').value.trim());
      S.set('settings.model', body.querySelector('#mModel').value);
      status.textContent = 'যাচাই চলছে…';
      const r = await A.verify();
      status.textContent = r.message;
      U.toast(r.message, r.ok ? 'ok' : 'err');
    };

    body.querySelector('#mExport').onclick = () => {
      const blob = new Blob([S.export()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bcs-verse-backup-' + Date.now() + '.json';
      a.click();
      URL.revokeObjectURL(url);
      U.toast('ব্যাকআপ ডাউনলোড হয়েছে', 'ok');
    };

    body.querySelector('#mReset').onclick = () => {
      if (!confirm('সব ডেটা মুছে ফেলা হবে। নিশ্চিত?')) return;
      S.reset();
      location.reload();
    };
  }

  function openAuthModal() {
    U.modal(
      '<p class="muted sm mb-10">এই ডেমোতে অ্যাকাউন্ট শুধু আপনার ব্রাউজারে সংরক্ষিত হয় — কোনো সার্ভার নেই।</p>' +
      '<label class="lbl" for="aName">নাম</label>' +
      '<input id="aName" class="input mb-10" placeholder="যেমন: রাফিদ হাসান" />' +
      '<label class="lbl" for="aHandle">ইউজারনেম</label>' +
      '<input id="aHandle" class="input mb-10" placeholder="@rafid" />' +
      '<label class="lbl" for="aAvatar">অ্যাভাটার ইমোজি</label>' +
      '<input id="aAvatar" class="input" maxlength="4" placeholder="🦉" />' +
      '<button class="btn btn-grad btn-block mt-16" id="aSave">অ্যাকাউন্ট তৈরি করুন</button>'
    );
    U.modalTitle('✨ অ্যাকাউন্ট খুলুন');

    document.getElementById('aSave').onclick = () => {
      const name = document.getElementById('aName').value.trim() || 'পরীক্ষার্থী';
      const handle = document.getElementById('aHandle').value.trim() || ('@' + name.replace(/\s+/g, '').toLowerCase());
      const avatar = document.getElementById('aAvatar').value.trim() || '🎯';
      S.patch({ user: { name, handle: handle.startsWith('@') ? handle : '@' + handle, avatar } });
      U.closeModal();
      U.toast('স্বাগতম, ' + name + '!', 'ok');
      renderSidebar();
    };
  }

  /* ---------------------------------------------------------
     HOME PAGE
     --------------------------------------------------------- */
  function initHome() {
    initFocus();
    initComposer();
    initFeed();

    S.onChange(() => { renderStats(); renderSidebar(); });
  }

  function initFocus() {
    const sel = document.getElementById('focusSubject');
    const display = document.getElementById('focusDisplay');
    const sub = document.getElementById('focusSub');
    const ring = document.getElementById('ringProgress');
    const btn = document.getElementById('focusBtn');
    const endBtn = document.getElementById('endBtn');
    const status = document.getElementById('focusStatus');
    const meta = document.getElementById('focusMeta');
    if (!sel) return;

    sel.innerHTML = C.SUBJECTS.map(s => '<option value="' + s.id + '">' + s.icon + ' ' + U.esc(s.name) + '</option>').join('');

    const KEY = 'bcsverse.timer';
    let running = false, startedAt = 0, elapsed = 0, ticker = null;

    function render() {
      display.textContent = U.clock(elapsed);
      const pct = Math.min(elapsed / 3600, 1); // full ring = 1 hour
      const dash = 540.35;
      ring.style.strokeDashoffset = String(dash * (1 - pct));
    }

    function start() {
      running = true;
      startedAt = Date.now() - elapsed * 1000;
      localStorage.setItem(KEY, JSON.stringify({ startedAt, subject: sel.value }));
      btn.textContent = '⏸ বিরতি';
      endBtn.disabled = false;
      status.textContent = 'চলছে';
      status.className = 'chip chip-green';
      sub.textContent = C.subjectById(sel.value).name;
      ticker = setInterval(() => {
        elapsed = Math.floor((Date.now() - startedAt) / 1000);
        render();
      }, 1000);
    }

    function stop(save) {
      running = false;
      clearInterval(ticker);
      localStorage.removeItem(KEY);
      btn.textContent = '▶ শুরু করুন';
      endBtn.disabled = true;
      status.textContent = 'প্রস্তুত';
      status.className = 'chip chip-green';
      if (save && elapsed > 10) {
        const minutes = Math.round(elapsed / 60);
        const stats = S.recordSession(minutes, sel.value);
        U.toast('সেশন সংরক্ষিত — ' + U.bn(minutes) + ' মিনিট', 'ok');
        if (meta) meta.textContent = 'মোট ' + U.bn(stats.hours) + ' ঘণ্টা · ' + U.bn(stats.sessions) + ' সেশন';
      }
      elapsed = 0;
      render();
      sub.textContent = 'সেশন শুরু করুন';
    }

    // resume
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && saved.startedAt) {
        elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
        sel.value = saved.subject || sel.value;
        start();
      }
    } catch (_) {}

    render();
    if (meta) {
      const s = S.get().stats;
      meta.textContent = 'মোট ' + U.bn(s.hours) + ' ঘণ্টা · ' + U.bn(s.sessions) + ' সেশন';
    }

    btn.addEventListener('click', () => {
      if (running) stop(false);
      else start();
    });
    endBtn.addEventListener('click', () => stop(true));
    sel.addEventListener('change', () => { if (running) sub.textContent = C.subjectById(sel.value).name; });

    // expose to tab-fab
    window.__focusToggle = () => { if (running) stop(true); else start(); };
  }

  function initComposer() {
    const text = document.getElementById('postText');
    const counter = document.getElementById('postCounter');
    const tagsWrap = document.getElementById('quickTags');
    if (!text) return;

    const activeTags = new Set();

    if (tagsWrap) {
      tagsWrap.innerHTML = C.QUICK_TAGS.map(t =>
        '<button type="button" class="quick-tag" data-tag="' + U.esc(t) + '">' + U.esc(t) + '</button>'
      ).join('');
      tagsWrap.querySelectorAll('.quick-tag').forEach(b => {
        b.addEventListener('click', () => {
          const tag = b.dataset.tag;
          if (activeTags.has(tag)) { activeTags.delete(tag); b.classList.remove('on'); b.style.background = ''; b.style.color = ''; }
          else { activeTags.add(tag); b.classList.add('on'); b.style.background = 'var(--grad)'; b.style.color = '#fff'; }
        });
      });
    }

    function updateCounter() {
      counter.textContent = U.bn(text.value.length) + '/' + U.bn(1000);
    }
    text.addEventListener('input', updateCounter);
    updateCounter();

    document.querySelectorAll('[data-action="post"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = text.value.trim();
        if (!val) { U.toast('কিছু লিখুন', 'err'); text.focus(); return; }
        if (val.length > 1000) { U.toast('১০০০ অক্ষরের বেশি নয়', 'err'); return; }
        S.addPost(val, Array.from(activeTags));
        text.value = '';
        activeTags.clear();
        tagsWrap.querySelectorAll('.quick-tag').forEach(b => { b.classList.remove('on'); b.style.background = ''; b.style.color = ''; });
        updateCounter();
        U.toast('পোস্ট প্রকাশিত 🚀', 'ok');
      });
    });

    text.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.querySelector('[data-action="post"]').click();
      }
    });
  }

  function initFeed() {
    const feed = document.getElementById('feed');
    const tabs = document.getElementById('feedTabs');
    const search = document.getElementById('feedSearch');
    if (!feed) return;

    let filter = 'all';
    let query = '';

    function postHTML(p) {
      const likedCls = p.liked ? ' on like' : '';
      const savedCls = p.saved ? ' on' : '';
      const tags = (p.tags || []).map(t => '<span class="post-tag">#' + U.esc(t) + '</span>').join('');
      const isMine = p.mine || p.handle === S.get().user.handle;
      return '<article class="post" data-id="' + p.id + '">' +
        '<div class="post-head">' +
          '<div class="post-av">' + U.esc(p.avatar) + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div class="post-name">' + U.esc(p.author) +
              (isMine ? ' <span class="chip chip-indigo" style="padding:2px 8px;font-size:.66rem">আমি</span>' : '') +
            '</div>' +
            '<div class="post-time">' + U.esc(p.handle) + ' · ' + U.timeAgo(p.time) + '</div>' +
          '</div>' +
          (isMine ? '<button class="act" data-del="' + p.id + '" title="মুছুন">🗑</button>' : '') +
        '</div>' +
        '<div class="post-body">' + U.rich(p.text) + '</div>' +
        (tags ? '<div class="post-tags">' + tags + '</div>' : '') +
        '<div class="post-actions">' +
          '<button class="act like' + likedCls + '" data-like="' + p.id + '">🤍 <span>' + U.bn(p.likes || 0) + '</span></button>' +
          '<button class="act" data-comment="' + p.id + '">💬 <span>' + U.bn(p.comments || 0) + '</span></button>' +
          '<button class="act' + savedCls + '" data-save="' + p.id + '">🔖 <span>' + (p.saved ? 'সেভড' : 'সেভ') + '</span></button>' +
          '<button class="act" data-copy="' + p.id + '">🔗 শেয়ার</button>' +
        '</div>' +
      '</article>';
    }

    function render() {
      let list = (S.get().posts || []).slice();
      if (filter === 'mine') list = list.filter(p => p.mine || p.handle === S.get().user.handle);
      if (filter === 'saved') list = list.filter(p => p.saved);
      if (filter === 'live') list = list.filter(p => (p.tags || []).some(t => /লাইভ|প্রিলি|জরুরি/i.test(t)));
      if (query) {
        const q = query.toLowerCase();
        list = list.filter(p =>
          p.text.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
      }

      if (!list.length) {
        feed.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>কোনো পোস্ট পাওয়া যায়নি।</p></div>';
        return;
      }
      feed.innerHTML = list.map(postHTML).join('');
    }

    feed.addEventListener('click', e => {
      const t = e.target.closest('[data-like],[data-save],[data-del],[data-copy],[data-comment]');
      if (!t) return;
      if (t.dataset.like) { S.toggleLike(t.dataset.like); render(); }
      if (t.dataset.save) { S.toggleSave(t.dataset.save); render(); }
      if (t.dataset.del) { S.deletePost(t.dataset.del); render(); U.toast('পোস্ট মুছে ফেলা হয়েছে', 'info'); }
      if (t.dataset.copy) {
        const p = S.get().posts.find(x => x.id === t.dataset.copy);
        if (p) {
          navigator.clipboard?.writeText(p.text).then(
            () => U.toast('টেক্সট কপি হয়েছে', 'ok'),
            () => U.toast('কপি করা যায়নি', 'err')
          );
        }
      }
      if (t.dataset.comment) U.toast('কমেন্ট শীঘ্রই আসছে', 'info');
    });

    if (tabs) {
      tabs.addEventListener('click', e => {
        const b = e.target.closest('.tab');
        if (!b) return;
        tabs.querySelectorAll('.tab').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
        filter = b.dataset.filter;
        render();
      });
    }
    if (search) search.addEventListener('input', U.debounce(() => { query = search.value.trim(); render(); }, 180));

    S.onChange(render);
    render();
  }

  /* ---------------------------------------------------------
     LIVE PAGE
     --------------------------------------------------------- */
  function initLivePage() {
    initFocus();
    renderAvatars();

    const grid = document.getElementById('roomGrid');
    const tabs = document.getElementById('roomTabs');
    const countEl = document.getElementById('roomCount');
    const search = document.querySelector('[data-room-search]');

    if (!grid) return;
    let filter = 'all';
    let query = '';

    function roomHTML(r) {
      const subj = C.subjectById(r.subject);
      return '<article class="room" data-id="' + r.id + '">' +
        '<div class="room-top">' +
          '<div class="room-ico">' + r.avatar + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div class="room-name">' + U.esc(r.name) + '</div>' +
            '<div class="room-host">' + U.esc(r.host) + '</div>' +
          '</div>' +
          (r.active ? '<span class="room-live"><span class="pulse-dot" style="width:5px;height:5px"></span> LIVE</span>' : '<span class="chip">নিষ্ক্রিয়</span>') +
        '</div>' +
        '<p class="room-desc">' + U.esc(r.desc) + '</p>' +
        '<div class="room-foot">' +
          '<span class="room-people">👥 ' + U.bn(r.people) + ' জন</span>' +
          '<span class="chip chip-indigo">' + subj.icon + ' ' + U.esc(subj.name) + '</span>' +
        '</div>' +
      '</article>';
    }

    function render() {
      let list = S.get().rooms || [];
      if (filter === 'active') list = list.filter(r => r.active);
      else if (filter !== 'all') list = list.filter(r => r.subject === filter);
      if (query) {
        const q = query.toLowerCase();
        list = list.filter(r => r.name.toLowerCase().includes(q) || r.host.toLowerCase().includes(q));
      }
      if (countEl) countEl.textContent = U.bn(list.length) + 'টি রুম';
      if (!list.length) {
        grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🚪</div><p>কোনো রুম পাওয়া যায়নি।</p></div>';
        return;
      }
      grid.innerHTML = list.map(roomHTML).join('');
    }

    grid.addEventListener('click', e => {
      const card = e.target.closest('.room');
      if (!card) return;
      const r = (S.get().rooms || []).find(x => x.id === card.dataset.id);
      if (!r) return;
      U.modal(
        '<p class="muted sm mb-10">' + U.esc(r.desc) + '</p>' +
        '<div class="row between mb-10"><span class="muted sm">হোস্ট</span><b>' + U.esc(r.host) + '</b></div>' +
        '<div class="row between mb-10"><span class="muted sm">অংশগ্রহণকারী</span><b>' + U.bn(r.people) + ' জন</b></div>' +
        '<div class="row between mb-10"><span class="muted sm">বিষয়</span><b>' + C.subjectById(r.subject).name + '</b></div>' +
        '<button class="btn btn-grad btn-block mt-16" onclick="window.UI.closeModal(); window.UI.toast(\'রুমে যোগ দেওয়া হয়েছে 🎉\', \'ok\')">রুমে যোগ দিন</button>'
      );
      U.modalTitle(r.name);
    });

    if (tabs) {
      tabs.addEventListener('click', e => {
        const b = e.target.closest('.tab'); if (!b) return;
        tabs.querySelectorAll('.tab').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
        filter = b.dataset.filter;
        render();
      });
    }
    if (search) search.addEventListener('input', U.debounce(() => { query = search.value.trim(); render(); }, 180));

    renderLeaderboard();
    renderPartners();
    S.onChange(render);
    render();
  }

  function renderAvatars() {
    const stack = document.getElementById('liveAvatars');
    if (!stack) return;
    const live = (S.get().live || []).slice(0, 5);
    const more = Math.max(0, (S.get().live || []).length - 5) + 4;
    stack.innerHTML = live.map(l => '<span class="as">' + l.avatar + '</span>').join('') +
      (more ? '<span class="as more">+' + U.bn(more) + '</span>' : '');
  }

  function renderPartners() {
    const el = document.getElementById('partnerList');
    if (!el) return;
    const people = (S.get().live || []).slice(0, 5);
    el.innerHTML = people.map(p => {
      const s = C.subjectById(p.subject);
      return '<div class="person">' +
        '<div class="person-av">' + p.avatar + '</div>' +
        '<div class="person-info">' +
          '<div class="person-name">' + U.esc(p.user) + '</div>' +
          '<div class="person-sub">' + s.icon + ' ' + U.esc(s.name) + ' · ' + U.bn(p.minutes) + ' মি</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /* ---------------------------------------------------------
     AI PAGE
     --------------------------------------------------------- */
  function initAiPage() {
    const histEl = document.getElementById('chatHistory');
    const msgEl = document.getElementById('chatMessages');
    const emptyEl = document.getElementById('chatEmpty');
    const scroll = document.getElementById('chatScroll');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const newBtn = document.getElementById('newChatBtn');
    const fab = document.getElementById('tabFabNew');
    const modelSel = document.getElementById('modelSelect');
    const modelBadge = document.getElementById('modelBadge');
    const presetGrid = document.getElementById('presetGrid');
    const presetBtns = document.querySelectorAll('[data-preset]');
    const subjectChips = document.getElementById('aiSubjectChips');
    const apiInput = document.getElementById('apiKeyInput');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const verifyKeyBtn = document.getElementById('verifyKeyBtn');
    const keyStatus = document.getElementById('keyStatus');
    const statusChip = document.getElementById('aiStatusChip');
    const clearBtn = document.getElementById('clearChatBtn');

    if (!form) return;

    // model select
    modelSel.innerHTML = C.GEMINI_MODELS.map(m =>
      '<option value="' + m.id + '">' + m.name + '</option>'
    ).join('');
    modelSel.value = S.get_path('settings.model', 'gemini-3.6-flash');
    modelBadge.textContent = modelSel.value;
    modelSel.addEventListener('change', () => {
      S.setModel(modelSel.value);
      modelBadge.textContent = modelSel.value;
      U.toast('মডেল: ' + modelSel.value, 'info');
    });

    // key panel
    if (apiInput) apiInput.value = S.get_path('settings.apiKey', '');
    function refreshKeyStatus() {
      const has = A.hasKey();
      statusChip.textContent = has ? 'সংযুক্ত' : 'Key প্রয়োজন';
      statusChip.className = 'chip ' + (has ? 'chip-green' : 'chip');
      keyStatus.textContent = has ? 'Key সেট করা আছে ✓' : 'Key সেট করা হয়নি';
    }
    refreshKeyStatus();
    if (saveKeyBtn) saveKeyBtn.onclick = () => {
      S.setApiKey(apiInput.value.trim());
      refreshKeyStatus();
      U.toast('API Key সংরক্ষিত', 'ok');
    };
    if (verifyKeyBtn) verifyKeyBtn.onclick = async () => {
      S.setApiKey(apiInput.value.trim());
      keyStatus.textContent = 'যাচাই চলছে…';
      const r = await A.verify();
      keyStatus.textContent = r.message;
      refreshKeyStatus();
      U.toast(r.message, r.ok ? 'ok' : 'err');
    };

    // presets
    if (presetGrid) {
      presetGrid.innerHTML = C.PRESETS.map(p =>
        '<button class="preset" data-preset-id="' + p.id + '">' +
          '<div class="preset-ico">' + p.icon + '</div>' +
          '<div class="preset-title">' + U.esc(p.title) + '</div>' +
          '<div class="preset-sub">' + U.esc(p.sub) + '</div>' +
        '</button>'
      ).join('');
      presetGrid.addEventListener('click', e => {
        const b = e.target.closest('[data-preset-id]'); if (!b) return;
        const p = C.PRESETS.find(x => x.id === b.dataset.presetId);
        if (p) queuePrompt(p.prompt);
      });
    }

    presetBtns.forEach(b => b.addEventListener('click', () => {
      const p = C.PRESETS.find(x => x.id === b.dataset.preset);
      if (p) queuePrompt(p.prompt);
    }));

    // subject chips
    if (subjectChips) {
      subjectChips.innerHTML = C.SUBJECTS.map(s =>
        '<button class="topic-chip" data-subj="' + s.id + '">' + s.icon + ' ' + U.esc(s.name) + '</button>'
      ).join('');
      subjectChips.addEventListener('click', e => {
        const b = e.target.closest('[data-subj]'); if (!b) return;
        const s = C.subjectById(b.dataset.subj);
        queuePrompt('আমাকে "' + s.name + '" বিষয়ে ৫টি গুরুত্বপূর্ণ পয়েন্ট সহজ বাংলায় ব্যাখ্যা করুন।');
      });
    }

    // deep-link ?prompt=mcq
    const params = new URLSearchParams(location.search);
    const p = params.get('prompt');
    if (p) {
      const found = C.PRESETS.find(x => x.id === p);
      if (found) queuePrompt(found.prompt);
    }

    function queuePrompt(text) {
      if (!S.activeChat()) S.createChat(text.slice(0, 30));
      input.value = text;
      input.focus();
      autoGrow();
      renderHistory();
    }

    function renderHistory() {
      const chats = S.get().chats || [];
      const active = S.get().activeChatId;
      if (!chats.length) {
        histEl.innerHTML = '<p class="muted xs" style="padding:8px">এখনো কোনো চ্যাট নেই</p>';
        return;
      }
      histEl.innerHTML = chats.map(c =>
        '<div class="chat-item' + (c.id === active ? ' is-active' : '') + '" data-chat="' + c.id + '">' +
          '<span>💬</span>' +
          '<span class="chat-item-title">' + U.esc(c.title) + '</span>' +
          '<span class="chat-item-del" data-del-chat="' + c.id + '">✕</span>' +
        '</div>'
      ).join('');
    }

    histEl.addEventListener('click', e => {
      const del = e.target.closest('[data-del-chat]');
      if (del) { e.stopPropagation(); S.deleteChat(del.dataset.delChat); renderHistory(); renderMessages(); return; }
      const item = e.target.closest('[data-chat]');
      if (item) { S.set('activeChatId', item.dataset.chat); renderHistory(); renderMessages(); }
    });

    function msgHTML(m) {
      const isUser = m.role === 'user';
      return '<div class="msg ' + (isUser ? 'user' : 'ai') + '">' +
        '<div class="msg-av">' + (isUser ? '🙋' : '✨') + '</div>' +
        '<div><div class="msg-bubble">' + U.rich(m.text) + '</div>' +
        '<div class="msg-time">' + U.timeAgo(m.at) + '</div></div>' +
      '</div>';
    }

    function renderMessages() {
      const chat = S.activeChat();
      if (!chat || !chat.messages.length) {
        emptyEl.style.display = '';
        msgEl.innerHTML = '';
        return;
      }
      emptyEl.style.display = 'none';
      msgEl.innerHTML = chat.messages.map(msgHTML).join('');
      scrollToBottom();
    }

    function scrollToBottom() {
      requestAnimationFrame(() => { scroll.scrollTop = scroll.scrollHeight; });
    }

    function autoGrow() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 180) + 'px';
    }
    input.addEventListener('input', autoGrow);

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    function showTyping() {
      const el = document.createElement('div');
      el.className = 'msg ai';
      el.id = 'typingMsg';
      el.innerHTML = '<div class="msg-av">✨</div><div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
      msgEl.appendChild(el);
      scrollToBottom();
    }
    function hideTyping() {
      const el = document.getElementById('typingMsg');
      if (el) el.remove();
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      if (!A.hasKey()) {
        U.toast('আগে API Key সেট করুন', 'err');
        if (apiInput) { apiInput.focus(); apiInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }

      let chat = S.activeChat();
      if (!chat) chat = S.createChat(text.slice(0, 30));

      S.addMessage(chat.id, 'user', text);
      input.value = ''; autoGrow();
      renderHistory(); renderMessages();
      emptyEl.style.display = 'none';

      showTyping();
      sendBtn.disabled = true;

      try {
        const history = chat.messages.slice(0, -1).map(m => ({ role: m.role === 'user' ? 'user' : 'ai', text: m.text }));
        const reply = await A.send(history, text);
        hideTyping();
        S.addMessage(chat.id, 'ai', reply);
        S.bumpAiChats();
        renderMessages();
      } catch (err) {
        hideTyping();
        S.addMessage(chat.id, 'ai', '⚠️ ' + err.message);
        renderMessages();
        U.toast(err.message, 'err');
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    });

    function newChat() {
      S.createChat('নতুন চ্যাট');
      renderHistory(); renderMessages();
      input.focus();
    }
    if (newBtn) newBtn.onclick = newChat;
    if (fab) fab.onclick = e => { e.preventDefault(); newChat(); };

    if (clearBtn) clearBtn.onclick = () => {
      const chat = S.activeChat();
      if (!chat) return;
      if (!confirm('এই চ্যাটের সব বার্তা মুছে ফেলা হবে?')) return;
      chat.messages = [];
      S.patch({ chats: S.get().chats });
      renderMessages();
      U.toast('চ্যাট পরিষ্কার', 'info');
    };

    // init
    if (!S.get().chats || !S.get().chats.length) S.createChat('নতুন চ্যাট');
    renderHistory();
    renderMessages();
    S.onChange(() => { renderHistory(); });
  }

  /* ---------------------------------------------------------
     PROFILE PAGE
     --------------------------------------------------------- */
  function initProfilePage() {
    const u = S.get().user;
    const s = S.get().stats;

    document.getElementById('profileAvatar').textContent = u.avatar;
    document.getElementById('profileName').textContent = u.name;
    document.getElementById('profileHandle').textContent = u.handle;
    document.getElementById('profileBio').textContent = u.bio;
    document.getElementById('joinDate').textContent = new Date(u.joinedAt).toLocaleDateString('bn-BD');

    document.getElementById('profileStats').innerHTML = [
      { v: U.bn(s.hours || 0), l: 'ঘণ্টা পড়া' },
      { v: U.bn(s.sessions || 0), l: 'ফোকাস সেশন' },
      { v: U.bn(s.posts || 0), l: 'পোস্ট' },
      { v: U.bn(s.streak || 0), l: 'দিন স্ট্রিক' },
      { v: U.bn(s.aiChats || 0), l: 'এআই চ্যাট' }
    ].map(x => '<div class="pstat"><b>' + x.v + '</b><span>' + x.l + '</span></div>').join('');

    // tabs
    const tabs = document.getElementById('profileTabs');
    if (tabs) {
      tabs.addEventListener('click', e => {
        const b = e.target.closest('.tab'); if (!b) return;
        tabs.querySelectorAll('.tab').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('is-active'));
        document.querySelector('[data-panel="' + b.dataset.tab + '"]')?.classList.add('is-active');
      });
    }

    // posts
    const postsEl = document.getElementById('profilePosts');
    const mine = (S.get().posts || []).filter(p => p.mine || p.handle === u.handle);
    if (mine.length) {
      postsEl.classList.remove('feed-flat');
      postsEl.innerHTML = mine.map(p =>
        '<article class="post">' +
          '<div class="post-head"><div class="post-av">' + p.avatar + '</div>' +
          '<div><div class="post-name">' + U.esc(p.author) + '</div>' +
          '<div class="post-time">' + U.timeAgo(p.time) + '</div></div></div>' +
          '<div class="post-body">' + U.rich(p.text) + '</div>' +
          ((p.tags || []).length ? '<div class="post-tags">' + p.tags.map(t => '<span class="post-tag">#' + U.esc(t) + '</span>').join('') + '</div>' : '') +
        '</article>'
      ).join('');
    } else {
      postsEl.innerHTML = '<div class="empty"><div class="empty-icon">✍️</div><p>এখনো কোনো পোস্ট নেই।</p><a class="btn btn-grad mt-12" href="index.html">প্রথম পোস্ট লিখুন</a></div>';
    }

    // timeline
    const tl = document.getElementById('sessionTimeline');
    const sessions = (S.get().stats.sessions || 0);
    const items = [
      { ico: '🎯', t: 'ফোকাস সেশন সম্পন্ন', s: U.bn(sessions) + 'টি মোট' },
      { ico: '📝', t: 'পোস্ট প্রকাশ', s: U.bn(s.posts || 0) + 'টি মোট' },
      { ico: '✨', t: 'এআই মেন্টর ব্যবহার', s: U.bn(s.aiChats || 0) + 'টি চ্যাট' },
      { ico: '📅', t: 'অ্যাকাউন্ট তৈরি', s: new Date(u.joinedAt).toLocaleDateString('bn-BD') }
    ];
    tl.innerHTML = items.map(i =>
      '<div class="tl-item"><div class="tl-dot">' + i.ico + '</div>' +
      '<div class="tl-body"><div class="tl-title">' + i.t + '</div>' +
      '<div class="tl-time">' + i.s + '</div></div></div>'
    ).join('');

    // badges
    const badgeGrid = document.getElementById('badgeGrid');
    if (badgeGrid) {
      badgeGrid.innerHTML = C.BADGES.map(b => {
        const unlocked = b.req(s);
        return '<div class="badge' + (unlocked ? '' : ' locked') + '">' +
          '<div class="badge-ico">' + b.icon + '</div>' +
          '<div class="badge-name">' + U.esc(b.name) + '</div>' +
          '<div class="badge-desc">' + U.esc(b.desc) + '</div>' +
        '</div>';
      }).join('');
    }

    const topBadges = document.getElementById('topBadges');
    if (topBadges) {
      topBadges.innerHTML = C.BADGES.filter(b => b.req(s)).slice(0, 5).map(b =>
        '<span class="badge-mini" title="' + U.esc(b.name) + '">' + b.icon + '</span>'
      ).join('') || '<p class="muted xs">এখনো কোনো ব্যাজ নেই</p>';
    }

    // streak days
    const sd = document.getElementById('streakDays');
    if (sd) {
      const days = ['র','সো','ম','বু','বৃ','শু','শ'];
      const today = new Date().getDay();
      const order = [6, 0, 1, 2, 3, 4, 5];
      sd.innerHTML = order.map((d, i) => {
        const done = i < Math.min(S.get().stats.streak || 0, 7);
        const isToday = d === today;
        return '<span class="sd' + (done ? ' done' : '') + (isToday ? ' today' : '') + '">' + days[i] + '</span>';
      }).join('');
    }
    document.getElementById('streakBig').textContent = U.bn(S.get().stats.streak || 0);

    // weekly goal
    const goal = document.getElementById('weeklyGoal');
    if (goal) {
      const target = (u.dailyGoal || 4) * 7;
      const done = Math.min(S.get().stats.hours || 0, target);
      const pct = Math.round((done / target) * 100);
      goal.innerHTML =
        '<div class="goal-row"><span>সাপ্তাহিক লক্ষ্য</span><b>' + U.bn(done) + ' / ' + U.bn(target) + ' ঘণ্টা</b></div>' +
        '<div class="goal-bar"><div class="goal-fill" style="width:' + pct + '%"></div></div>' +
        '<p class="muted xs">' + U.bn(pct) + '% সম্পন্ন — চালিয়ে যান! 💪</p>';
    }

    // subject progress
    const sp = document.getElementById('subjectProgress');
    if (sp) {
      const seed = [72, 58, 41, 66, 53, 34, 47, 28, 61, 39];
      sp.innerHTML = C.SUBJECTS.map((sub, i) => {
        const pct = seed[i % seed.length];
        return '<div class="prog-row">' +
          '<div class="prog-head"><span>' + sub.icon + ' ' + U.esc(sub.name) + '</span><span>' + U.bn(pct) + '%</span></div>' +
          '<div class="prog-track"><div class="prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,' + sub.color + ',var(--brand-2))"></div></div>' +
        '</div>';
      }).join('');
    }

    // settings form
    const f = {
      name: document.getElementById('setName'),
      handle: document.getElementById('setHandle'),
      bio: document.getElementById('setBio'),
      avatar: document.getElementById('setAvatar'),
      goal: document.getElementById('setGoal')
    };
    f.name.value = u.name;
    f.handle.value = u.handle;
    f.bio.value = u.bio;
    f.avatar.value = u.avatar;
    f.goal.value = u.dailyGoal || 4;

    document.getElementById('saveProfileBtn').onclick = () => {
      S.patch({ user: {
        name: f.name.value.trim() || u.name,
        handle: (f.handle.value.trim().startsWith('@') ? f.handle.value.trim() : '@' + f.handle.value.trim()) || u.handle,
        bio: f.bio.value.trim(),
        avatar: f.avatar.value.trim() || '🎯',
        dailyGoal: Math.max(1, Math.min(16, parseInt(f.goal.value, 10) || 4))
      }});
      U.toast('প্রোফাইল সংরক্ষিত ✓', 'ok');
      setTimeout(() => location.reload(), 500);
    };

    document.getElementById('exportBtn').onclick = () => {
      const blob = new Blob([S.export()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'bcs-verse-backup.json'; a.click();
      URL.revokeObjectURL(url);
      U.toast('ডেটা এক্সপোর্ট হয়েছে', 'ok');
    };

    document.getElementById('resetBtn').onclick = () => {
      if (!confirm('সব ডেটা মুছে যাবে। নিশ্চিত?')) return;
      S.reset();
      location.reload();
    };

    document.getElementById('editProfileBtn').onclick = () => {
      const tabs = document.getElementById('profileTabs');
      tabs.querySelectorAll('.tab').forEach(x => x.classList.remove('is-active'));
      tabs.querySelector('[data-tab="settings"]').classList.add('is-active');
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('is-active'));
      document.querySelector('[data-panel="settings"]').classList.add('is-active');
      document.getElementById('setName').focus();
    };

    renderSidebar();
    renderStats();
  }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  function boot() {
    S.init();
    applyTheme(S.get_path('settings.theme', 'dark'));
    initTheme();
    initBurger();
    initGlobalKeys();
    initSettingsAction();
    renderSidebar();
    renderStats();
    renderLiveDot();

    // Tabbar FAB on home/live pages should toggle focus or post
    document.querySelectorAll('.tab-fab[data-action="focus-toggle"]').forEach(b => {
      b.addEventListener('click', () => window.__focusToggle && window.__focusToggle());
    });

    const page = document.body.dataset.page;
    if (page === 'home') {
      initHome();
      renderLiveStrip();
      renderLeaderboard();
      renderTopics();
    } else if (page === 'live') {
      initLivePage();
    } else if (page === 'ai') {
      initAiPage();
    } else if (page === 'profile') {
      initProfilePage();
    }

    // global header live count
    const liveCount = document.getElementById('liveCount');
    if (liveCount && page !== 'home') {
      const total = 128 + (S.get().live || []).length;
      liveCount.textContent = U.bn(total) + ' জন';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
