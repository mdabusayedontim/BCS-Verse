/* ============================================================
   BCS Verse — Gemini AI integration
   API: Interactions API (v1beta)  •  Model: gemini-3.6-flash

   Request:
     POST https://generativelanguage.googleapis.com/v1beta/interactions
     Header: x-goog-api-key: <KEY>
     Body:   { model: "gemini-3.6-flash", input: "<text>" }

   Response:
     { steps: [ { type: "model_output", content: [ { text: "..." } ] } ] }
   ============================================================ */
(function () {
  'use strict';

  const BCS = window.BCS;
  const C = BCS.CONFIG;

  /** Error categories surfaced to the UI. */
  const AIError = {
    NO_KEY: 'NO_KEY',
    BAD_KEY: 'BAD_KEY',
    RATE_LIMIT: 'RATE_LIMIT',
    NETWORK: 'NETWORK',
    BLOCKED: 'BLOCKED',
    MODEL_GONE: 'MODEL_GONE',
    UNKNOWN: 'UNKNOWN'
  };

  /* ----------------------------------------------------------
     Turn history into a single prompt string.
     The Interactions API accepts a plain string `input`, so we
     fold the previous conversation into a compact transcript.
     ---------------------------------------------------------- */
  function buildInput(history, prompt) {
    const parts = [C.SYSTEM_PROMPT, ''];

    if (history && history.length) {
      parts.push('--- পূর্ববর্তী আলোচনা ---');
      history.forEach((m) => {
        parts.push((m.role === 'user' ? 'শিক্ষার্থী' : 'মেন্টর') + ': ' + m.text);
      });
      parts.push('--- বর্তমান প্রশ্ন ---');
    } else {
      parts.push('--- প্রশ্ন ---');
    }

    parts.push('শিক্ষার্থী: ' + prompt);
    parts.push('');
    parts.push('নির্দেশনা: উপরের প্রশ্নের উত্তর বাংলায় দাও। স্পষ্ট, তথ্যসমৃদ্ধ ও পরীক্ষার উপযোগী রাখো।');
    return parts.join('\n');
  }

  /* ----------------------------------------------------------
     Extract text from the Interactions API response shape.
     Tolerant to minor shape variations.
     ---------------------------------------------------------- */
  function extractText(data) {
    if (!data) return '';

    /* Primary: { steps: [ { type: "model_output", content: [{ text }] } ] } */
    if (Array.isArray(data.steps)) {
      for (const step of data.steps) {
        if (step && step.type === 'model_output') {
          const blocks = step.content;
          if (Array.isArray(blocks)) {
            const joined = blocks
              .map((b) => (b && typeof b.text === 'string' ? b.text : ''))
              .join('')
              .trim();
            if (joined) return joined;
          }
          if (typeof step.text === 'string' && step.text.trim()) {
            return step.text.trim();
          }
        }
      }
    }

    /* Fallback: { output: [...] } / { output: "..." } */
    if (typeof data.output === 'string' && data.output.trim()) return data.output.trim();
    if (Array.isArray(data.output)) {
      const j = data.output
        .map((b) => (b && (b.text || (b.content && b.content[0] && b.content[0].text))) || '')
        .join('')
        .trim();
      if (j) return j;
    }

    /* Fallback: { text: "..." } */
    if (typeof data.text === 'string' && data.text.trim()) return data.text.trim();

    /* Fallback: classic candidates[] shape */
    if (Array.isArray(data.candidates) && data.candidates[0]) {
      const cand = data.candidates[0];
      const p = (cand.content && cand.content.parts) || [];
      const t = p.map((x) => x.text || '').join('').trim();
      if (t) return t;
    }

    return '';
  }

  /* ----------------------------------------------------------
     Detect a "model retired" notice from the API error message.
     ---------------------------------------------------------- */
  function isModelGone(msg) {
    return /no longer available|not found|deprecated|update your code|is not supported/i.test(String(msg || ''));
  }

  /* ----------------------------------------------------------
     Core generate call.
     ---------------------------------------------------------- */
  async function generate(history, prompt) {
    const key = (BCS.Store.getApiKey() || '').trim();
    const model = BCS.Store.getModel() || C.GEMINI_DEFAULT_MODEL;

    if (!key) {
      const e = new Error('API key নেই');
      e.code = AIError.NO_KEY;
      throw e;
    }

    const body = {
      model,
      input: buildInput(history, prompt)
    };

    let res;
    try {
      res = await fetch(C.GEMINI_INTERACTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      const e = new Error('নেটওয়ার্ক সংযোগ ব্যর্থ');
      e.code = AIError.NETWORK;
      throw e;
    }

    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }

    if (!res.ok) {
      const msg =
        (data && data.error && (data.error.message || data.error.status)) ||
        (data && data.message) ||
        ('HTTP ' + res.status);

      const e = new Error(msg);
      if (res.status === 401 || res.status === 403) e.code = AIError.BAD_KEY;
      else if (/API key not valid|API_KEY_INVALID|permission/i.test(msg)) e.code = AIError.BAD_KEY;
      else if (res.status === 429) e.code = AIError.RATE_LIMIT;
      else if (res.status === 400 && isModelGone(msg)) e.code = AIError.MODEL_GONE;
      else if (isModelGone(msg)) e.code = AIError.MODEL_GONE;
      else e.code = AIError.UNKNOWN;
      throw e;
    }

    const text = extractText(data);
    if (!text) {
      const e = new Error('খালি উত্তর এসেছে');
      e.code = AIError.BLOCKED;
      throw e;
    }
    return text;
  }

  /* ----------------------------------------------------------
     Friendly Bengali message for an error code.
     ---------------------------------------------------------- */
  function friendly(err) {
    switch (err && err.code) {
      case AIError.NO_KEY:
        return '⚙️ এআই ব্যবহার করতে সেটিংসে একটি Gemini API Key যোগ করুন।';
      case AIError.BAD_KEY:
        return '🔑 API Key টি বৈধ নয়। সেটিংস → এআই থেকে সঠিক key দিন (aistudio.google.com/apikey)।';
      case AIError.RATE_LIMIT:
        return '⏳ অনুরোধের সীমা (rate limit) ছাড়িয়ে গেছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
      case AIError.NETWORK:
        return '📡 ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না।';
      case AIError.MODEL_GONE:
        return '🔄 এই মডেলটি আর সমর্থিত নয়। সেটিংস → এআই থেকে gemini-3.6-flash নির্বাচন করুন।';
      case AIError.BLOCKED:
        return '🚫 উত্তর তৈরি করা যায়নি। প্রশ্নটি অন্যভাবে জিজ্ঞেস করুন।';
      default:
        return '⚠️ ' + ((err && err.message) || 'অজানা সমস্যা হয়েছে।');
    }
  }

  /* ----------------------------------------------------------
     Lightweight key validation — issues a tiny real request.
     ---------------------------------------------------------- */
  async function verifyKey() {
    try {
      await generate([], 'শুধু "ঠিক আছে" লিখে উত্তর দাও।');
      return { ok: true };
    } catch (err) {
      return { ok: false, message: friendly(err), code: err.code };
    }
  }

  /* ----------------------------------------------------------
     Prompt builders
     ---------------------------------------------------------- */
  function mcqPrompt(count) {
    const n = count || 5;
    return (
      `৫১তম বিসিএস প্রিলিমিনারি পরীক্ষার জন্য ${n}টি উচ্চ-সম্ভাব্য মডেল MCQ তৈরি করো।\n` +
      'নিচের বিষয়গুলো থেকে অন্তত একটি করে নাও: বাংলাদেশ বিষয়াবলী, আন্তর্জাতিক বিষয়াবলী, সাধারণ বিজ্ঞান, বাংলা সাহিত্য, ইংরেজি।\n\n' +
      'প্রতিটি প্রশ্নের ফরম্যাট ঠিক এইভাবে হবে:\n' +
      'প্রশ্ন ১: <প্রশ্ন>\nক) ... খ) ... গ) ... ঘ) ...\nসঠিক উত্তর: <ক/খ/গ/ঘ>\nব্যাখ্যা: <দুই লাইনে>\n\n' +
      'শেষে "সংক্ষিপ্ত রিভিশন নোট" শিরোনামে ৩টি বুলেট পয়েন্ট দাও।'
    );
  }

  function explainPrompt(topic) {
    return (
      `বিসিএস পরীক্ষার্থীর জন্য "${topic}" বিষয়টি সহজ বাংলায় ব্যাখ্যা করো।\n\n` +
      'কাঠামো:\n' +
      '১. মূল ধারণা (২–৩ লাইন)\n' +
      '২. গুরুত্বপূর্ণ পয়েন্ট (বুলেট)\n' +
      '৩. বিসিএসে কীভাবে আসে (প্রশ্নের ধরন)\n' +
      '৪. মনে রাখার টিপস\n' +
      '৫. সংক্ষিপ্ত সারাংশ'
    );
  }

  function improvePostPrompt(draft) {
    return (
      'নিচের বিসিএস পোস্টটি আরও গোছানো, স্পষ্ট ও আকর্ষণীয় করে লেখো। ' +
      'মূল তথ্য ঠিক রেখে ভাষা উন্নত করো। শুধু উন্নত টেক্সট ফেরত দাও, কোনো ভূমিকা বা ব্যাখ্যা নয়। ' +
      'শেষে প্রাসঙ্গিক ২–৩টি হ্যাশট্যাগ যোগ করো।\n\n---\n' + draft
    );
  }

  function summarizePrompt(text) {
    return (
      'নিচের লেখাটি বিসিএস পরীক্ষার্থীর জন্য সংক্ষেপে সাজাও। ' +
      '৫টি বুলেট পয়েন্টে মূল কথা, এবং শেষে ৩টি সম্ভাব্য পরীক্ষার প্রশ্ন দাও।\n\n---\n' + text
    );
  }

  BCS.AI = {
    AIError,
    generate,
    friendly,
    verifyKey,
    mcqPrompt,
    explainPrompt,
    improvePostPrompt,
    summarizePrompt,
    _extractText: extractText,
    _buildInput: buildInput
  };
})();
