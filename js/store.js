/* ============================================================
   BCS Verse — State store with localStorage persistence
   + cross-tab live synchronisation via BroadcastChannel
   ============================================================ */
(function () {
  'use strict';

  const BCS = window.BCS;
  const P = BCS.CONFIG.STORAGE_PREFIX;

  const KEYS = {
    user: P + 'user',
    posts: P + 'posts',
    live: P + 'live',
    stats: P + 'stats',
    settings: P + 'settings',
    session: P + 'session',
    seeded: P + 'seeded'
  };

  /* ---------------- Seed data ---------------- */
  const now = Date.now();
  const MIN = 60 * 1000;

  const SEED_LIVE = [
    { id: 'l1', name: 'তানভীর আহমেদ', target: '৫১তম বিসিএস • প্রশাসন', subject: 'বাংলাদেশ বিষয়াবলী', minutes: 42, username: 'tanvir_bcs' },
    { id: 'l2', name: 'সাদিয়া তাসনিম', target: 'বিসিএস • পররাষ্ট্র', subject: 'আন্তর্জাতিক বিষয়াবলী', minutes: 58, username: 'sadia_ta' },
    { id: 'l3', name: 'রাকিবুল হাসান', target: 'বিসিএস • পুলিশ', subject: 'গাণিতিক যুক্তি ও মানসিক দক্ষতা', minutes: 25, username: 'rakib_h' },
    { id: 'l4', name: 'নুসরাত জাহান', target: 'বিসিএস • শিক্ষা', subject: 'ইংরেজি সাহিত্য ও ব্যাকরণ', minutes: 19, username: 'nusrat_j' },
    { id: 'l5', name: 'মেহেদী হাসান', target: '৫১তম বিসিএস • সাধারণ', subject: 'সাধারণ বিজ্ঞান ও তথ্যপ্রযুক্তি', minutes: 73, username: 'mehedi_h' },
    { id: 'l6', name: 'ফারজানা আক্তার', target: 'বিসিএস • কর', subject: 'বাংলা ভাষা ও সাহিত্য', minutes: 31, username: 'farzana_a' }
  ];

  const SEED_POSTS = [
    {
      id: 'p_seed_1',
      author: 'তানভীর আহমেদ',
      username: 'tanvir_bcs',
      content:
        'সংবিধানের ২৭–৪৪ অনুচ্ছেদের মৌলিক অধিকারগুলো নিয়মিত রিভিশনে রাখা জরুরি। বিশেষ করে অনুচ্ছেদ ২৮ (বৈষম্য বিলোপ) ও অনুচ্ছেদ ৩২ (জীবন ও ব্যক্তিস্বাধীনতা) থেকে বিগত বিসিএসে বারবার প্রশ্ন এসেছে।\n\nমনে রাখার কৌশল: ২৭ = সাম্যের অধিকার, ২৮ = বৈষম্য বিলোপ, ২৯ = সরকারি চাকরিতে সুযোগের সমতা, ৩০ = বিদেশি উপাধি নিষিদ্ধ।\n\n#বাংলাদেশ_বিষয়াবলী #সংবিধান',
      likes: [], saves: [],
      comments: [
        { id: 'c1', author: 'সাদিয়া তাসনিম', username: 'sadia_ta', text: 'দারুণ সাজানো! ৩১ অনুচ্ছেদটাও যোগ করলে ভালো হয় — আইনের আশ্রয়লাভের অধিকার।', ts: now - 8 * MIN }
      ],
      ts: now - 22 * MIN,
      live: true
    },
    {
      id: 'p_seed_2',
      author: 'BCS Verse এআই মেন্টর',
      username: 'ai_mentor',
      isBot: true,
      content:
        '💡 আজকের কুইক মডেল প্রশ্ন\n\nপ্রশ্ন: পদ্মা সেতুর দুই প্রান্তের সংযোগকারী জেলা কোন দুটি?\n\nউত্তর: মুন্সীগঞ্জ (মাওয়া প্রান্ত) এবং শরীয়তপুর (জাজিরা প্রান্ত)।\n\nঅতিরিক্ত তথ্য — সেতুর দৈর্ঘ্য ৬.১৫ কিমি, উদ্বোধন ২৫ জুন ২০২২।\n\n#বাংলাদেশ_বিষয়াবলী',
      likes: [], saves: [], comments: [],
      ts: now - 68 * MIN,
      live: false
    },
    {
      id: 'p_seed_3',
      author: 'নুসরাত জাহান',
      username: 'nusrat_j',
      content:
        'ইংরেজি সাহিত্যের জন্য আমার স্ট্র্যাটেজি শেয়ার করছি 👇\n\n১) Period-wise না পড়ে Author-wise পড়া — মনে থাকে বেশি।\n২) প্রতিটি author-এর জন্য ২টি উল্লেখযোগ্য work + ১টি famous quote।\n৩) রোজ ১৫ মিনিট শুধু quotation রিভিশন।\n\n৫১তম প্রিলিতে সাহিত্য থেকে গড়ে ৮–১০টি প্রশ্ন আসে, তাই এটা অবহেলা করা যাবে না।\n\n#English_Literature',
      likes: [], saves: [], comments: [],
      ts: now - 3 * 60 * MIN,
      live: false
    }
  ];

  /* ---------------- Store ---------------- */
  const Store = {
    keys: KEYS,
    state: {
      user: null,
      posts: [],
      live: [],
      stats: { streak: 0, lastStudy: null, totalMinutes: 0, sessions: 0 },
      settings: { apiKey: '', model: '', theme: 'dark' },
      session: null
    },
    _listeners: new Set(),
    _channel: null,

    _read(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (raw == null) return fallback;
        return JSON.parse(raw);
      } catch (e) {
        console.warn('[BCS] read failed', key, e);
        return fallback;
      }
    },
    _write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('[BCS] write failed', key, e);
      }
    },

    init() {
      const seeded = this._read(KEYS.seeded, false);

      this.state.user = this._read(KEYS.user, null);
      this.state.posts = this._read(KEYS.posts, null) || (seeded ? [] : SEED_POSTS.slice());
      this.state.live = this._read(KEYS.live, null) || (seeded ? [] : SEED_LIVE.slice());
      this.state.stats = Object.assign(
        { streak: 0, lastStudy: null, totalMinutes: 0, sessions: 0 },
        this._read(KEYS.stats, {})
      );
      this.state.settings = Object.assign(
        { apiKey: BCS.CONFIG.GEMINI_DEFAULT_KEY, model: BCS.CONFIG.GEMINI_DEFAULT_MODEL, theme: 'dark' },
        this._read(KEYS.settings, {})
      );
      this.state.session = this._read(KEYS.session, null);

      if (!seeded) {
        this._write(KEYS.seeded, true);
        this._write(KEYS.posts, this.state.posts);
        this._write(KEYS.live, this.state.live);
      }

      /* restore running session across reloads */
      if (this.state.session && this.state.session.running) {
        const drift = Math.floor((Date.now() - this.state.session.updatedAt) / 1000);
        if (drift > 0) this.state.session.elapsed += drift;
      }

      this._setupCrossTab();
      this._applyTheme();
      return this;
    },

    _setupCrossTab() {
      try {
        this._channel = new BroadcastChannel(BCS.CONFIG.CHANNEL);
        this._channel.onmessage = (ev) => {
          if (!ev.data || ev.data.origin === this._tabId) return;
          this.reload();
        };
      } catch (e) {
        this._channel = null;
      }
      this._tabId = BCS.uid('tab');

      window.addEventListener('storage', (e) => {
        if (e.key && e.key.indexOf(BCS.CONFIG.STORAGE_PREFIX) === 0) this.reload();
      });
    },

    broadcast() {
      if (this._channel) {
        try { this._channel.postMessage({ origin: this._tabId, t: Date.now() }); } catch (e) {}
      }
    },

    reload() {
      this.state.posts = this._read(KEYS.posts, this.state.posts);
      this.state.live = this._read(KEYS.live, this.state.live);
      this.state.stats = this._read(KEYS.stats, this.state.stats);
      this.state.user = this._read(KEYS.user, this.state.user);
      this.state.session = this._read(KEYS.session, this.state.session);
      this.emit();
    },

    subscribe(fn) {
      this._listeners.add(fn);
      return () => this._listeners.delete(fn);
    },
    emit() {
      this._listeners.forEach((fn) => {
        try { fn(this.state); } catch (e) { console.error(e); }
      });
    },
    commit(reason) {
      this.broadcast();
      this.emit(reason);
    },

    _applyTheme() {
      document.documentElement.setAttribute('data-theme', this.state.settings.theme || 'dark');
    },
    toggleTheme() {
      const next = (this.state.settings.theme === 'dark') ? 'light' : 'dark';
      this.state.settings.theme = next;
      this._write(KEYS.settings, this.state.settings);
      this._applyTheme();
      this.commit('theme');
      return next;
    },

    saveSettings(patch) {
      this.state.settings = Object.assign({}, this.state.settings, patch);
      this._write(KEYS.settings, this.state.settings);
      this._applyTheme();
      this.commit('settings');
    },
    getApiKey() {
      return (this.state.settings.apiKey || '').trim();
    },
    getModel() {
      return this.state.settings.model || BCS.CONFIG.GEMINI_DEFAULT_MODEL;
    },

    /* ---- auth ---- */
    signIn({ name, username, target }) {
      this.state.user = {
        name: name.trim(),
        username: username.trim().replace(/^@/, ''),
        target: (target || '').trim() || '৫১তম বিসিএস প্রস্তুতি',
        joined: Date.now()
      };
      this._write(KEYS.user, this.state.user);
      this.commit('auth');
      return this.state.user;
    },
    signOut() {
      this.state.user = null;
      localStorage.removeItem(KEYS.user);
      this.commit('auth');
    },
    isLoggedIn() {
      return !!this.state.user;
    },

    /* ---- posts ---- */
    addPost(content) {
      if (!this.state.user) return null;
      const post = {
        id: BCS.uid('p'),
        author: this.state.user.name,
        username: this.state.user.username,
        content: content.trim(),
        likes: [], saves: [], comments: [],
        ts: Date.now(),
        live: !!(this.state.session && this.state.session.running)
      };
      this.state.posts.unshift(post);
      this._write(KEYS.posts, this.state.posts);
      this.commit('post');
      return post;
    },

    deletePost(id) {
      this.state.posts = this.state.posts.filter((p) => p.id !== id);
      this._write(KEYS.posts, this.state.posts);
      this.commit('post');
    },

    toggleLike(id) {
      if (!this.state.user) return null;
      const p = this.state.posts.find((x) => x.id === id);
      if (!p) return null;
      p.likes = p.likes || [];
      const i = p.likes.indexOf(this.state.user.username);
      const liked = i === -1;
      if (liked) p.likes.push(this.state.user.username);
      else p.likes.splice(i, 1);
      this._write(KEYS.posts, this.state.posts);
      this.commit('post');
      return liked;
    },

    toggleSave(id) {
      if (!this.state.user) return null;
      const p = this.state.posts.find((x) => x.id === id);
      if (!p) return null;
      p.saves = p.saves || [];
      const i = p.saves.indexOf(this.state.user.username);
      const saved = i === -1;
      if (saved) p.saves.push(this.state.user.username);
      else p.saves.splice(i, 1);
      this._write(KEYS.posts, this.state.posts);
      this.commit('post');
      return saved;
    },

    addComment(postId, text) {
      if (!this.state.user) return null;
      const p = this.state.posts.find((x) => x.id === postId);
      if (!p) return null;
      p.comments = p.comments || [];
      const c = {
        id: BCS.uid('c'),
        author: this.state.user.name,
        username: this.state.user.username,
        text: text.trim().slice(0, BCS.CONFIG.MAX_COMMENT_LEN),
        ts: Date.now()
      };
      p.comments.push(c);
      this._write(KEYS.posts, this.state.posts);
      this.commit('post');
      return c;
    },

    /* ---- live users ---- */
    goLive(subjectName) {
      if (!this.state.user) return;
      const u = this.state.user;
      this.state.live = this.state.live.filter((x) => x.username !== u.username);
      this.state.live.unshift({
        id: BCS.uid('live'),
        username: u.username,
        name: u.name,
        target: u.target || '৫১তম বিসিএস প্রস্তুতি',
        subject: subjectName,
        minutes: 1,
        isMe: true
      });
      this._write(KEYS.live, this.state.live);
      this.commit('live');
    },
    goOffline() {
      if (!this.state.user) return;
      this.state.live = this.state.live.filter((x) => x.username !== this.state.user.username);
      this._write(KEYS.live, this.state.live);
      this.commit('live');
    },
    isLiveNow() {
      return !!(this.state.session && this.state.session.running);
    },

    /* ---- focus session ---- */
    startSession(subjectName) {
      this.state.session = {
        subject: subjectName,
        startedAt: Date.now(),
        updatedAt: Date.now(),
        elapsed: 0,
        running: true,
        paused: false
      };
      this._write(KEYS.session, this.state.session);
      this.goLive(subjectName);
      this.commit('session');
      return this.state.session;
    },
    pauseSession() {
      if (!this.state.session) return;
      this.state.session.running = false;
      this.state.session.paused = true;
      this.state.session.updatedAt = Date.now();
      this._write(KEYS.session, this.state.session);
      this.commit('session');
    },
    resumeSession() {
      if (!this.state.session) return;
      this.state.session.running = true;
      this.state.session.paused = false;
      this.state.session.updatedAt = Date.now();
      this._write(KEYS.session, this.state.session);
      this.commit('session');
    },
    tickSession() {
      const s = this.state.session;
      if (!s || !s.running) return;
      s.elapsed += 1;
      s.updatedAt = Date.now();
      if (s.elapsed % 20 === 0) this._write(KEYS.session, s);
    },

    endSession() {
      const s = this.state.session;
      if (!s) return null;
      const minutes = Math.max(1, Math.round(s.elapsed / 60));
      const result = { subject: s.subject, seconds: s.elapsed, minutes };

      this.state.session = null;
      this._write(KEYS.session, null);

      const st = this.state.stats;
      const today = BCS.todayKey();
      if (st.lastStudy === today) {
        /* already counted today */
      } else if (st.lastStudy === BCS.yesterdayKey()) {
        st.streak = (st.streak || 0) + 1;
      } else {
        st.streak = 1;
      }
      st.lastStudy = today;
      st.totalMinutes = (st.totalMinutes || 0) + minutes;
      st.sessions = (st.sessions || 0) + 1;
      this._write(KEYS.stats, st);

      this.goOffline();
      this.commit('session');
      return result;
    },

    /* ---- derived ---- */
    userPosts() {
      if (!this.state.user) return [];
      return this.state.posts.filter((p) => p.username === this.state.user.username);
    },

    leaderboard() {
      const map = new Map();
      this.state.live.forEach((u) => {
        map.set(u.username, {
          name: u.name,
          username: u.username,
          minutes: (map.get(u.username)?.minutes || 0) + (u.minutes || 0)
        });
      });
      if (this.state.user) {
        const u = this.state.user;
        const cur = map.get(u.username) || { name: u.name, username: u.username, minutes: 0 };
        cur.minutes += this.state.stats.totalMinutes || 0;
        map.set(u.username, cur);
      }
      return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes).slice(0, 6);
    }
  };

  BCS.Store = Store;
})();
