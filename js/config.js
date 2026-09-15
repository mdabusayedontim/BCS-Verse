/* ============================================================
   BCS Verse — Configuration & shared constants
   API: Google Gemini Interactions API (v1beta)
   Model: gemini-3.6-flash
   ============================================================ */
(function () {
  'use strict';

  const BCS = (window.BCS = window.BCS || {});

  BCS.CONFIG = {
    APP_NAME: 'BCS Verse',
    STORAGE_PREFIX: 'bcsverse.',
    CHANNEL: 'bcsverse-sync',

    /* ---------------------------------------------------------
       Gemini — Interactions API
       Endpoint:  POST https://generativelanguage.googleapis.com/v1beta/interactions
       Auth:      header  x-goog-api-key: <KEY>
       Body:      { model, input }
       Response:  { steps: [ { type: "model_output", content: [ { text } ] } ] }
       --------------------------------------------------------- */
    GEMINI_INTERACTIONS_URL:
      'https://generativelanguage.googleapis.com/v1beta/interactions',

    GEMINI_DEFAULT_MODEL: 'gemini-3.6-flash',

    /* Models available in Settings dropdown.
       "gemini-3.6-flash" is recommended by Google for best quality/speed. */
    GEMINI_MODELS: [
      'gemini-3.6-flash',
      'gemini-3.6-flash-lite',
      'gemini-3.6-pro',
      'gemini-3.5-flash',
      'gemini-3.0-flash'
    ],

    /* Pre-filled key placeholder.
       ⚠️ Replace with your own key from https://aistudio.google.com/apikey
       (Format: AIza…)  Leave empty to force users to add their own key. */
    GEMINI_DEFAULT_KEY: '',

    /* Persona injected into every Interactions request. */
    SYSTEM_PROMPT:
      'তুমি "BCS Verse" এর একজন অভিজ্ঞ বিসিএস মেন্টর। তুমি বাংলাদেশ সিভিল সার্ভিস (BCS) পরীক্ষার প্রস্তুতি নেওয়া পরীক্ষার্থীদের সাহায্য করো। ' +
      'সব উত্তর বাংলায় দাও, সংক্ষিপ্ত কিন্তু তথ্যসমৃদ্ধ। গুরুত্বপূর্ণ পয়েন্ট বুলেট আকারে সাজাও। ' +
      'প্রিলিমিনারি ও লিখিত — উভয় পরীক্ষার প্রাসঙ্গিকতা মাথায় রাখো। ' +
      'যদি কোনো তথ্য নিশ্চিত না হও, সেটি স্পষ্টভাবে বলো।',

    MAX_POST_LEN: 1000,
    MINUTES_PER_RING: 60,
    MAX_COMMENT_LEN: 400
  };

  /* ---------- BCS Subjects ---------- */
  BCS.SUBJECTS = [
    { id: 'bd',      name: 'বাংলাদেশ বিষয়াবলী',              emoji: '🇧🇩', hue: 152 },
    { id: 'intl',    name: 'আন্তর্জাতিক বিষয়াবলী',           emoji: '🌍', hue: 205 },
    { id: 'eng',     name: 'ইংরেজি সাহিত্য ও ব্যাকরণ',        emoji: '📘', hue: 265 },
    { id: 'bangla',  name: 'বাংলা ভাষা ও সাহিত্য',            emoji: '📖', hue: 330 },
    { id: 'sci',     name: 'সাধারণ বিজ্ঞান ও তথ্যপ্রযুক্তি',  emoji: '🔬', hue: 190 },
    { id: 'math',    name: 'গাণিতিক যুক্তি ও মানসিক দক্ষতা',  emoji: '🧮', hue: 25  },
    { id: 'geo',     name: 'ভূগোল, পরিবেশ ও দুর্যোগ',         emoji: '🗺️', hue: 105 },
    { id: 'ethics',  name: 'নৈতিকতা ও সুশাসন',                emoji: '⚖️', hue: 45  }
  ];

  BCS.subjectById = (id) => BCS.SUBJECTS.find((s) => s.id === id) || BCS.SUBJECTS[0];
  BCS.subjectByName = (name) => BCS.SUBJECTS.find((s) => s.name === name) || null;

  /* ---------- Utilities ---------- */
  const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  BCS.toBn = function (value) {
    return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
  };

  BCS.escapeHtml = function (str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  };

  BCS.avatar = function (name, size) {
    const seed = BCS.hash(String(name || 'anon'));
    const h1 = seed % 360;
    const h2 = (h1 + 46) % 360;
    const cls = size === 'lg' ? 'av-lg' : size === 'md' ? 'av-md' : size === 'sm' ? 'av-sm' : 'av-xs';
    const bg = `background:linear-gradient(135deg,hsl(${h1} 68% 52%),hsl(${h2} 70% 40%))`;
    return { cls, bg, initials: BCS.initials(name) };
  };

  BCS.avatarHtml = function (name, size, extraClass) {
    const a = BCS.avatar(name, size);
    return `<div class="av ${a.cls} ${extraClass || ''}" style="${a.bg}" aria-hidden="true">${BCS.escapeHtml(a.initials)}</div>`;
  };

  BCS.initials = function (name) {
    const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  BCS.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  };

  BCS.uid = function (prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  BCS.clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  BCS.relTime = function (ts) {
    const diff = Math.max(0, Date.now() - ts);
    const s = Math.floor(diff / 1000);
    if (s < 45) return 'এইমাত্র';
    const m = Math.floor(s / 60);
    if (m < 60) return BCS.toBn(m) + ' মিনিট আগে';
    const h = Math.floor(m / 60);
    if (h < 24) return BCS.toBn(h) + ' ঘণ্টা আগে';
    const d = Math.floor(h / 24);
    if (d < 7) return BCS.toBn(d) + ' দিন আগে';
    const dt = new Date(ts);
    return BCS.toBn(dt.getDate()) + '/' + BCS.toBn(dt.getMonth() + 1) + '/' + BCS.toBn(dt.getFullYear());
  };

  BCS.formatClock = function (totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const pad = (n) => String(n).padStart(2, '0');
    return BCS.toBn(`${pad(h)}:${pad(m)}:${pad(s)}`);
  };

  BCS.formatMinutes = function (mins) {
    if (mins < 60) return BCS.toBn(Math.round(mins)) + ' মিনিট';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m ? BCS.toBn(h) + ' ঘণ্টা ' + BCS.toBn(m) + ' মিনিট' : BCS.toBn(h) + ' ঘণ্টা';
  };

  BCS.todayKey = function (d) {
    const dt = d ? new Date(d) : new Date();
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  };

  BCS.yesterdayKey = function () {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return BCS.todayKey(d);
  };

  BCS.debounce = function (fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  BCS.richText = function (raw) {
    return BCS.escapeHtml(raw)
      .replace(/(^|\s)(#[\w\u0980-\u09FF_]+)/g, '$1<span class="hash" data-tag="$2">$2</span>')
      .replace(/(^|\s)(@[A-Za-z0-9_]+)/g, '$1<span class="men">$2</span>');
  };
})();
