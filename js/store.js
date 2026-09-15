/* =========================================================
   BCS Verse — Local-first Store
   ========================================================= */
(function () {
  'use strict';

  const KEY = window.BCS.STORAGE_KEY;

  const DEFAULTS = () => ({
    user: {
      name: 'অতিথি পরীক্ষার্থী',
      handle: '@aspirant',
      bio: '৫১তম বিসিএস প্রস্তুতি চলছে — প্রতিদিন ৪ ঘণ্টা ফোকাস।',
      avatar: '🎯',
      dailyGoal: 4,
      joinedAt: Date.now()
    },
    stats: { streak: 0, hours: 0, sessions: 0, posts: 0, aiChats: 0 },
    lastStudyDay: null,
    posts: [],
    live: [],
    rooms: [],
    leaderboard: [],
    chats: [],
    activeChatId: null,
    settings: {
      theme: 'dark',
      model: 'gemini-3.6-flash',
      apiKey: ''
    },
    savedPostIds: [],
    likedPostIds: [],
    seededAt: null
  });

  let state = null;
  const listeners = new Set();

  function _read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Store] read failed', e);
      return null;
    }
  }

  function _write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[Store] write failed', e);
    }
  }

  function _deepMerge(base, patch) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    for (const k in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, k)) continue;
      const v = patch[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        out[k] = _deepMerge(base[k], v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  function _seed() {
    state.posts = window.BCS.SEED_POSTS.map(p => Object.assign({}, p));
    state.live = window.BCS.SEED_LIVE.map(l => Object.assign({}, l));
    state.rooms = window.BCS.SEED_ROOMS.map(r => Object.assign({}, r));
    state.leaderboard = window.BCS.SEED_LEADERBOARD.map(l => Object.assign({}, l));
    state.seededAt = Date.now();
  }

  const Store = {
    init() {
      const saved = _read();
      state = _deepMerge(DEFAULTS(), saved || {});
      if (!state.seededAt) _seed();
      _write();
      return state;
    },

    get() { return state; },

    patch(obj) {
      state = _deepMerge(state, obj);
      _write();
      this.broadcast();
      return state;
    },

    set(path, value) {
      const keys = path.split('.');
      let cur = state;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      _write();
      this.broadcast();
      return state;
    },

    get_path(path, fallback) {
      const keys = path.split('.');
      let cur = state;
      for (const k of keys) {
        if (cur == null) return fallback;
        cur = cur[k];
      }
      return cur === undefined ? fallback : cur;
    },

    /* ---------- posts ---------- */
    addPost(text, tags) {
      const post = {
        id: 'p' + Date.now().toString(36),
        author: state.user.name,
        avatar: state.user.avatar,
        handle: state.user.handle,
        time: Date.now(),
        text: text.trim(),
        tags: tags || [],
        likes: 0, comments: 0,
        saved: false, liked: false,
        mine: true
      };
      state.posts.unshift(post);
      state.stats.posts = (state.stats.posts || 0) + 1;
      _write();
      this.broadcast();
      return post;
    },

    deletePost(id) {
      state.posts = state.posts.filter(p => p.id !== id);
      _write(); this.broadcast();
    },

    toggleLike(id) {
      const p = state.posts.find(x => x.id === id);
      if (!p) return;
      p.liked = !p.liked;
      p.likes += p.liked ? 1 : -1;
      if (p.likes < 0) p.likes = 0;
      _write(); this.broadcast();
      return p;
    },

    toggleSave(id) {
      const p = state.posts.find(x => x.id === id);
      if (!p) return;
      p.saved = !p.saved;
      _write(); this.broadcast();
      return p;
    },

    /* ---------- session ---------- */
    recordSession(minutes, subjectId) {
      const hrs = minutes / 60;
      state.stats.hours = Math.round(((state.stats.hours || 0) + hrs) * 10) / 10;
      state.stats.sessions = (state.stats.sessions || 0) + 1;

      const today = new Date().toDateString();
      if (state.lastStudyDay !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        state.stats.streak = state.lastStudyDay === yesterday
          ? (state.stats.streak || 0) + 1
          : 1;
        state.lastStudyDay = today;
      }

      _write(); this.broadcast();
      return state.stats;
    },

    /* ---------- chats ---------- */
    createChat(title) {
      const chat = {
        id: 'c' + Date.now().toString(36),
        title: title || 'নতুন চ্যাট',
        messages: [],
        createdAt: Date.now()
      };
      state.chats.unshift(chat);
      state.activeChatId = chat.id;
      _write(); this.broadcast();
      return chat;
    },

    activeChat() {
      if (!state.activeChatId) return null;
      return state.chats.find(c => c.id === state.activeChatId) || null;
    },

    addMessage(chatId, role, text) {
      const chat = state.chats.find(c => c.id === chatId);
      if (!chat) return null;
      const msg = { role, text, at: Date.now() };
      chat.messages.push(msg);
      if (role === 'user' && chat.messages.filter(m => m.role === 'user').length === 1) {
        chat.title = text.slice(0, 34) + (text.length > 34 ? '…' : '');
      }
      _write(); this.broadcast();
      return msg;
    },

    deleteChat(id) {
      state.chats = state.chats.filter(c => c.id !== id);
      if (state.activeChatId === id) state.activeChatId = state.chats[0] ? state.chats[0].id : null;
      _write(); this.broadcast();
    },

    bumpAiChats() {
      state.stats.aiChats = (state.stats.aiChats || 0) + 1;
      _write(); this.broadcast();
    },

    /* ---------- settings ---------- */
    setTheme(t) { state.settings.theme = t; _write(); this.broadcast(); },
    setModel(m) { state.settings.model = m; _write(); this.broadcast(); },
    setApiKey(k) { state.settings.apiKey = k; _write(); this.broadcast(); },

    export() {
      return JSON.stringify(state, null, 2);
    },

    reset() {
      localStorage.removeItem(KEY);
      state = DEFAULTS();
      _seed();
      _write();
      this.broadcast();
      return state;
    },

    /* ---------- reactivity ---------- */
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    broadcast() { listeners.forEach(fn => { try { fn(state); } catch (e) { console.warn(e); } }); }
  };

  window.Store = Store;
})();
