/* =========================================================
   BCS Verse — Configuration
   ========================================================= */
window.BCS = window.BCS || {};

BCS.VERSION = '3.0.0';
BCS.STORAGE_KEY = 'bcsverse.v3';

/* ---------- Gemini ---------- */
BCS.GEMINI_INTERACTIONS_URL =
  'https://generativelanguage.googleapis.com/v1beta/interactions';

/* Default key intentionally empty — user supplies their own. */
BCS.GEMINI_DEFAULT_KEY = '';

BCS.GEMINI_MODELS = [
  { id: 'gemini-3.6-flash',      name: 'Gemini 3.6 Flash',      note: 'দ্রুত + স্মার্ট (ডিফল্ট)' },
  { id: 'gemini-3.6-flash-lite', name: 'Gemini 3.6 Flash Lite', note: 'সবচেয়ে দ্রুত' },
  { id: 'gemini-3.6-pro',        name: 'Gemini 3.6 Pro',        note: 'সবচেয়ে স্মার্ট' },
  { id: 'gemini-3.5-flash',      name: 'Gemini 3.5 Flash',      note: 'স্থিতিশীল' },
  { id: 'gemini-3.0-flash',      name: 'Gemini 3.0 Flash',      note: 'লিগ্যাসি' }
];

/* ---------- Subjects ---------- */
BCS.SUBJECTS = [
  { id: 'bangla',     name: 'বাংলা ভাষা ও সাহিত্য',   icon: '📖', color: '#f59e0b' },
  { id: 'english',    name: 'ইংরেজি ভাষা ও সাহিত্য',   icon: '🔤', color: '#3b82f6' },
  { id: 'math',       name: 'গাণিতিক যুক্তি',          icon: '➗', color: '#8b5cf6' },
  { id: 'gk-bd',      name: 'বাংলাদেশ বিষয়াবলি',      icon: '🇧🇩', color: '#10b981' },
  { id: 'gk-intl',    name: 'আন্তর্জাতিক বিষয়াবলি',   icon: '🌍', color: '#06b6d4' },
  { id: 'science',    name: 'সাধারণ বিজ্ঞান',          icon: '🔬', color: '#ec4899' },
  { id: 'ict',        name: 'কম্পিউটার ও তথ্যপ্রযুক্তি', icon: '💻', color: '#6366f1' },
  { id: 'geography',  name: 'ভূগোল ও পরিবেশ',          icon: '🗺️', color: '#84cc16' },
  { id: 'mental',     name: 'মানসিক দক্ষতা',           icon: '🧠', color: '#f43f5e' },
  { id: 'ethics',     name: 'নৈতিকতা ও সুশাসন',        icon: '⚖️', color: '#a855f7' }
];

BCS.subjectById = function (id) {
  return BCS.SUBJECTS.find(s => s.id === id) || BCS.SUBJECTS[0];
};

/* ---------- System prompt ---------- */
BCS.SYSTEM_PROMPT = `তুমি "BCS Verse AI Mentor" — ৫১তম বিসিএস (বাংলাদেশ সিভিল সার্ভিস) প্রস্তুতির একজন অভিজ্ঞ শিক্ষক ও মেন্টর।

নিয়মাবলি:
- সবসময় সহজ, প্রাঞ্জল বাংলায় উত্তর দাও। প্রয়োজনে ইংরেজি টার্ম ব্যবহার করো।
- উত্তরের শুরুতে সরাসরি মূল পয়েন্ট দাও, তারপর ব্যাখ্যা।
- MCQ চাইলে অবশ্যই ৪টি অপশন (ক, খ, গ, ঘ) দাও এবং শেষে সঠিক উত্তর + সংক্ষিপ্ত ব্যাখ্যা।
- তারিখ, সাল, সংখ্যা নিয়ে নিশ্চিত না হলে স্পষ্টভাবে বলো "যাচাই করে নিন"।
- উত্তরের শেষে ২-৩টি দ্রুত রিভিশন পয়েন্ট যোগ করো।
- শিক্ষার্থীকে উৎসাহ দাও, কিন্তু অতিরিক্ত ভূমিকা রচনা করো না।`;

/* ---------- Quick prompts / presets ---------- */
BCS.PRESETS = [
  { id: 'mcq',    icon: '🎯', title: '৫টি মডেল MCQ',        sub: 'যেকোনো বিষয়ে ৫টি প্রশ্ন, অপশন ও ব্যাখ্যাসহ', prompt: '৫১তম বিসিএস প্রিলি উপযোগী ৫টি MCQ তৈরি করুন। প্রতিটিতে ৪টি অপশন, সঠিক উত্তর এবং সংক্ষিপ্ত ব্যাখ্যা থাকবে।' },
  { id: 'explain',icon: '💡', title: 'টপিক সহজে বুঝুন',      sub: 'কঠিন টপিক ধাপে ধাপে সহজ ব্যাখ্যা', prompt: 'নিচের টপিকটি একেবারে সহজ বাংলায়, উদাহরণসহ ধাপে ধাপে ব্যাখ্যা করুন: ' },
  { id: 'plan',   icon: '📅', title: '৭ দিনের স্টাডি প্ল্যান', sub: 'আপনার সময় অনুযায়ী কাস্টম রুটিন', prompt: 'আমার জন্য ৭ দিনের একটি কার্যকর বিসিএস স্টাডি প্ল্যান তৈরি করুন। প্রতিদিন কোন বিষয়, কত সময় এবং কী রিভিশন করব তা সারণি আকারে দিন।' },
  { id: 'written',icon: '✍️', title: 'লিখিত উত্তর আউটলাইন',  sub: 'লিখিত পরীক্ষার জন্য কাঠামোবদ্ধ রূপরেখা', prompt: '৫১তম বিসিএস লিখিত পরীক্ষার জন্য নিচের বিষয়ে একটি কাঠামোবদ্ধ উত্তর আউটলাইন তৈরি করুন (ভূমিকা, মূল অংশ, উপসংহার): ' },
  { id: 'current',icon: '📰', title: 'কারেন্ট অ্যাফেয়ার্স',   sub: 'সাম্প্রতিক ঘটনাবলির সংক্ষিপ্ত রিভিশন', prompt: 'বিগত ৬ মাসের গুরুত্বপূর্ণ জাতীয় ও আন্তর্জাতিক কারেন্ট অ্যাফেয়ার্সগুলো পয়েন্ট আকারে সাজিয়ে দিন, যা ৫১তম বিসিএসের জন্য প্রাসঙ্গিক।' },
  { id: 'math',   icon: '🧮', title: 'ম্যাথ সমাধান',          sub: 'গাণিতিক যুক্তির সমস্যা ধাপে ধাপে', prompt: 'নিচের গাণিতিক সমস্যাটি ধাপে ধাপে সমাধান করুন এবং প্রতিটি ধাপ ব্যাখ্যা করুন: ' }
];

/* ---------- Seed live sessions ---------- */
BCS.SEED_LIVE = [
  { id: 'l1', user: 'রাফিদ হাসান',   avatar: '🦉', subject: 'bangla',  minutes: 92,  label: 'বাংলা সাহিত্য' },
  { id: 'l2', user: 'নুসরাত জাহান',  avatar: '🌸', subject: 'math',    minutes: 47,  label: 'গাণিতিক যুক্তি' },
  { id: 'l3', user: 'তানভীর আহমেদ', avatar: '🚀', subject: 'gk-intl', minutes: 128, label: 'আন্তর্জাতিক' },
  { id: 'l4', user: 'সাদিয়া ইসলাম', avatar: '📚', subject: 'english', minutes: 33,  label: 'ইংরেজি' },
  { id: 'l5', user: 'মেহেদী হাসান',  avatar: '⚡', subject: 'science', minutes: 76,  label: 'সাধারণ বিজ্ঞান' },
  { id: 'l6', user: 'ফারহানা আক্তার',avatar: '🎯', subject: 'ict',     minutes: 55,  label: 'আইসিটি' }
];

/* ---------- Seed rooms ---------- */
BCS.SEED_ROOMS = [
  { id: 'r1', name: 'বাংলা সাহিত্য — রিভিশন', host: 'রাফিদ হাসান', avatar: '🦉', subject: 'bangla', people: 12, active: true,  desc: 'আধুনিক বাংলা সাহিত্যের গুরুত্বপূর্ণ লেখক ও রচনা নিয়ে দ্রুত রিভিশন।' },
  { id: 'r2', name: 'গাণিতিক যুক্তি — সমস্যা সমাধান', host: 'নুসরাত জাহান', avatar: '🌸', subject: 'math', people: 8, active: true, desc: 'পাটিগণিত, বীজগণিত ও জ্যামিতির চর্চা, লাইভ সমস্যা সমাধান।' },
  { id: 'r3', name: 'সাধারণ জ্ঞান — বাংলাদেশ', host: 'তানভীর আহমেদ', avatar: '🚀', subject: 'gk-bd', people: 21, active: true, desc: 'স্বাধীনতা যুদ্ধ, সংবিধান ও জাতীয় বিষয়াবলির পূর্ণ রিভিশন।' },
  { id: 'r4', name: 'ইংরেজি গ্রামার স্প্রিন্ট', host: 'সাদিয়া ইসলাম', avatar: '📚', subject: 'english', people: 5, active: false, desc: 'Parts of speech, tense ও preposition নিয়ে ৪৫ মিনিটের স্প্রিন্ট।' },
  { id: 'r5', name: 'সাধারণ বিজ্ঞান — নোট শেয়ার', host: 'মেহেদী হাসান', avatar: '⚡', subject: 'science', people: 14, active: true, desc: 'পদার্থ, রসায়ন ও জীববিজ্ঞানের গুরুত্বপূর্ণ তথ্য একসাথে।' },
  { id: 'r6', name: 'কারেন্ট অ্যাফেয়ার্স ডেইলি', host: 'ফারহানা আক্তার', avatar: '🎯', subject: 'gk-intl', people: 9, active: true, desc: 'প্রতিদিন সকালে ২০ মিনিটের কারেন্ট অ্যাফেয়ার্স আপডেট।' },
  { id: 'r7', name: 'আইসিটি ও কম্পিউটার', host: 'শাকিল রহমান', avatar: '💻', subject: 'ict', people: 6, active: false, desc: 'কম্পিউটার নেটওয়ার্ক, ডেটাবেজ ও সাইবার সিকিউরিটি।' },
  { id: 'r8', name: 'ভূগোল ও পরিবেশ', host: 'আয়েশা সিদ্দিকা', avatar: '🌍', subject: 'geography', people: 4, active: false, desc: 'বাংলাদেশ ও বিশ্বের ভূগোল, জলবায়ু পরিবর্তন নিয়ে আলোচনা।' }
];

/* ---------- Seed posts ---------- */
BCS.SEED_POSTS = [
  {
    id: 'p1', author: 'রাফিদ হাসান', avatar: '🦉', handle: '@rafid',
    time: Date.now() - 1000 * 60 * 24,
    text: 'বাংলা সাহিত্যে "মাইকেল মধুসূদন দত্ত" কে আধুনিক বাংলা সাহিত্যের প্রথম সার্থক নাট্যকার বলা হয়।\n\n📌 মনে রাখার টিপস:\n• প্রথম সার্থক বাংলা নাটক: শর্মিষ্ঠা (১৮৫৯)\n• প্রথম আধুনিক বাংলা মহাকাব্য: মেঘনাদবধ কাব্য (১৮৬১)\n• সনেট রচনার পথিকৃৎ',
    tags: ['বাংলা', 'সাহিত্য', 'প্রিলি'],
    likes: 42, comments: 7, saved: false, liked: false
  },
  {
    id: 'p2', author: 'নুসরাত জাহান', avatar: '🌸', handle: '@nusrat',
    time: Date.now() - 1000 * 60 * 88,
    text: 'আজকের অনুশীলন থেকে একটা ট্রিক শিখলাম:\n\nধরি, একটি সংখ্যা ৩০% বাড়ল, তারপর ৩০% কমল। চূড়ান্ত পরিবর্তন = ০% না!\n\nসূত্র: a + b + (ab/100)\n→ 30 + (-30) + (30×-30)/100 = -9%\n\nঅর্থাৎ ৯% কমে গেল। এই ভুলটাই আমি বার বার করতাম 😅',
    tags: ['গণিত', 'শর্টকাট'],
    likes: 28, comments: 5, saved: false, liked: false
  },
  {
    id: 'p3', author: 'তানভীর আহমেদ', avatar: '🚀', handle: '@tanvir',
    time: Date.now() - 1000 * 60 * 60 * 3,
    text: 'আজকের কারেন্ট অ্যাফেয়ার্স রিভিশন ✅\n\n১. চলতি বছরের জাতীয় বাজেট ঘোষণা\n২. নতুন শিক্ষা নীতির সাম্প্রতিক আপডেট\n৩. বাংলাদেশের GDP প্রবৃদ্ধির হার\n৪. SDG লক্ষ্যমাত্রায় বাংলাদেশের অবস্থান\n\nকারও নোট থাকলে শেয়ার করুন 🙏',
    tags: ['কারেন্ট অ্যাফেয়ার্স', 'জরুরি'],
    likes: 63, comments: 12, saved: false, liked: false
  },
  {
    id: 'p4', author: 'সাদিয়া ইসলাম', avatar: '📚', handle: '@sadia',
    time: Date.now() - 1000 * 60 * 60 * 8,
    text: 'ইংরেজি গ্রামারে "Articles" নিয়ে জটিলতা?\n\nA/An → অনির্দিষ্ট (indefinite)\nThe → নির্দিষ্ট (definite)\n\nগুরুত্বপূর্ণ নিয়ম: নদী, সমুদ্র, পর্বতমালা, সংবাদপত্র, পবিত্র গ্রন্থের আগে "The" বসে।\n\nব্রিটিশ কাউন্সিলের একটা ফ্রি রিসোর্স পেয়েছি, চাইলে জানাব।',
    tags: ['ইংরেজি', 'গ্রামার'],
    likes: 35, comments: 9, saved: false, liked: false
  }
];

/* ---------- Seed leaderboard ---------- */
BCS.SEED_LEADERBOARD = [
  { name: 'তানভীর আহমেদ', avatar: '🚀', hours: 38 },
  { name: 'রাফিদ হাসান',   avatar: '🦉', hours: 34 },
  { name: 'নুসরাত জাহান',  avatar: '🌸', hours: 31 },
  { name: 'সাদিয়া ইসলাম', avatar: '📚', hours: 27 },
  { name: 'মেহেদী হাসান',  avatar: '⚡', hours: 24 },
  { name: 'ফারহানা আক্তার',avatar: '🎯', hours: 21 }
];

/* ---------- Badges ---------- */
BCS.BADGES = [
  { id: 'b1', icon: '🌱', name: 'শুরুর পদক্ষেপ', desc: 'প্রথম স্টাডি সেশন সম্পন্ন', req: s => s.sessions >= 1 },
  { id: 'b2', icon: '🔥', name: '৩ দিনের স্ট্রিক', desc: 'টানা ৩ দিন পড়াশোনা', req: s => s.streak >= 3 },
  { id: 'b3', icon: '⚡', name: '১০ ঘণ্টা', desc: 'মোট ১০ ঘণ্টা ফোকাস', req: s => s.hours >= 10 },
  { id: 'b4', icon: '✍️', name: 'প্রথম পোস্ট', desc: 'নেটওয়ার্কে প্রথম অবদান', req: s => s.posts >= 1 },
  { id: 'b5', icon: '📚', name: 'নোট শেয়ারার', desc: '৫টি পোস্ট প্রকাশ', req: s => s.posts >= 5 },
  { id: 'b6', icon: '💎', name: '৫০ ঘণ্টা', desc: 'মোট ৫০ ঘণ্টা ফোকাস', req: s => s.hours >= 50 },
  { id: 'b7', icon: '🏆', name: 'সাপ্তাহিক চ্যাম্পিয়ন', desc: 'লিডারবোর্ডে শীর্ষ ৩', req: s => s.hours >= 30 },
  { id: 'b8', icon: '🎓', name: 'মেন্টর মাস্টার', desc: 'এআই মেন্টরের সাথে ২০টি চ্যাট', req: s => s.aiChats >= 20 }
];

/* ---------- Quick tags for composer ---------- */
BCS.QUICK_TAGS = ['বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ জ্ঞান', 'বিজ্ঞান', 'আইসিটি', 'প্রিলি', 'লিখিত'];
