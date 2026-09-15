# 📚 BCS Verse v2.1 — বিসিএস লাইভ স্টাডি নেটওয়ার্ক

৫১তম বিসিএস প্রস্তুতির জন্য একটি সম্পূর্ণ কার্যকর, মডার্ন **সোশ্যাল স্টাডি নেটওয়ার্ক**।
কোনো সার্ভার, ডেটাবেস
```

POST [https://generativelanguage.googleapis.com/v1beta/interactions](https://generativelanguage.googleapis.com/v1beta/interactions)
Header:  x-goog-api-key: <YOUR_KEY>
Body:    { "model": "gemini-3.6-flash", "input": "<prompt>" }

Response:
{
"steps": [
{ "type": "model_output", "content": [ { "text": "..." } ] }
]
}

```

**উন্নতি
```

gemini-3.6-flash        ← ডিফল্ট (দ্রুত + স্মার্ট)
gemini-3.6-flash-lite   ← সবচেয়ে দ্রুত
gemini-3.6-pro          ← সবচেয়ে স্মার্ট
gemini-3.5-flash
gemini-3.0-flash

```

---

##
```

তারপর **Settings → Pages → Source: main / root**।

### ৩. Vercel

```
npx vercel --prod
```

### ৪. লোকালি

শুধু `index.html` ব্রাউজারে ডাবল-ক্লিক করুন, অথবা:

```
npx serve
```

---

## 🔑 Gemini API Key সেটআপ (গুরুত্বপূর্ণ!)

1. [Google AI Studio](https://aistudio.google.com/apikey) এ যান
2. **Create API Key** ক্লিক করুন (বিনামূল্যে)
3. `AIza...` দিয়ে শুরু হওয়া key কপি করুন
4. ওয়েবসাইটে **সেটিংস → এআই** খুলে key পেস্ট করুন
5. **🔍 Key যাচাই করুন** চেপে নিশ্চিত হন

> ⚠️ **নিরাপত্তা:** ডিফল্ট key এখন খালি রাখা হয়েছে — ইউজার নিজের key দেবে।
> আপনার নিজের key `js/config.js` → `GEMINI_DEFAULT_KEY` এ বসাতে পারেন, কিন্তু
> **পাবলিকলি হোস্ট করার আগে খালি করে দিন**, নইলে যে কেউ আপনার key ব্যবহার করবে।

**API Key ছাড়াও সাইট পুরোপুরি কাজ করে** — শুধু এআই ফিচারগুলো নিষ্ক্রিয় থাকবে।

---

## 📁 ফাইল স্ট্রাকচার

```
bcs-verse/
├── index.html          # মূল
```

---

## ⌨️ কীবোর্ড শর্টকাট

| কী ↕▾ | কাজ ↕▾ |
|---|---|
| −`N` | নতুন পোস্টে ফোকাস |
| −`L` | লাইভ সেশন মোডাল খুলুন |
| −`K` | এআই মেন্টর খুলুন |
| −`Ctrl/Cmd + Enter` | পোস্ট প্রকাশ করুন |
| −`Esc` | মোডাল বন্ধ করুন |
⚙

---

## 🎨 ডিজাইন সিস্টেম

সব রঙ `css/style.css` এর `:root` এ CSS variable হিসেবে আছে:

```
--brand: #6366f1;    /* ইন্ডিগো */
--brand-2: #a855f7;  /* ভায়োলেট */
--p
```

---

## 🔧 কাস্টমাইজেশন

**নতুন বিষয় যোগ করুন** — `js/config.js` → `BCS.SUBJECTS`:

```
{ id: 'ict', name: 'তথ্য ও যোগাযোগ
```

**এআই-এর ব্যক্তিত্ব বদলান** — `config.js` → `SYSTEM_PROMPT`

**সিড ডেটা** — `store.js` → `SEED_LIVE`, `SEED_POSTS`

**এন্ডপয়েন্ট/মডেল** — `config.js` → `GEMINI_INTERACTIONS_URL`, `GEMINI_MODELS`

---

## 🐛 সমস্যা সমাধান

| সমস্যা ↕▾ | সমাধান ↕▾ |
|---|---|
| −"API Key বৈধ নয়" | সেটিংসে `AIza…` দিয়ে শুরু হওয়া key দিন |
| −"মডেল আর সমর্থিত নয়" | সেটিংসে `gemini-3.6-flash` নির্বাচন করুন |
| −"Rate limit ছাড়িয়ে গেছে" | কিছুক্ষণ অপেক্ষা করুন (ফ্রি টিয়ারে মিনিটে সীমা আছে) |
| −এআই উত্তর দিচ্ছে না | ইন্টারনেট চেক করুন, তারপর Settings → "🔍 Key যাচাই করুন" |
| −ডেটা হারিয়ে গেছে | Settings → "⬇️ ডেটা এক্সপোর্ট" দিয়ে ব্যাকআপ রাখুন |
⚙

---

## 🌐 রিয়েল মাল্টি-ইউজার করতে চান?

এই সংস্করণটি **লোকাল-ফার্স্ট**। একাধিক ডিভাইসে সিঙ্ক করতে:

- **Firebase Firestore** — `store.js` এর `_read/_write` মেথড দুটো Firestore কলে বদলান
- **Supabase** (Postgres + Realtime)
- **PocketBase** (self-hosted)

আর্কিটেকচার প্রস্তুত — `Store.commit()` প্রতিটি পরিবর্তনের পর `broadcast()` কল করে।

---

## 📄 লাইসেন্স

MIT — ব্যক্তিগত ও বাণিজ্যিক উভয় কাজে自由 ব্যবহার করুন।

---

**শুভকামনা, ৫১তম বিসিএস যোদ্ধা! 🎯**

```

</B
