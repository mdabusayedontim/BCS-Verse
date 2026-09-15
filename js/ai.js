/* =========================================================
   BCS Verse — Gemini AI bridge (Interactions API)
   ========================================================= */
(function () {
  'use strict';

  const C = window.BCS;

  function getKey() {
    return (window.Store.get_path('settings.apiKey', '') || C.GEMINI_DEFAULT_KEY || '').trim();
  }

  function getModel() {
    return window.Store.get_path('settings.model', 'gemini-3.6-flash');
  }

  function hasKey() { return getKey().length > 0; }

  /**
   * Pull text out of the Interactions API response shape:
   * { steps: [ { type: 'model_output', content: [ { text } ] } ] }
   */
  function extractText(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;

    if (Array.isArray(data.steps)) {
      const out = [];
      for (const step of data.steps) {
        if (step.type && step.type !== 'model_output') continue;
        if (Array.isArray(step.content)) {
          for (const c of step.content) {
            if (c && typeof c.text === 'string') out.push(c.text);
          }
        } else if (typeof step.text === 'string') {
          out.push(step.text);
        }
      }
      if (out.length) return out.join('\n').trim();
    }

    // fallbacks
    if (data.output_text) return String(data.output_text);
    if (data.text) return String(data.text);
    if (Array.isArray(data.candidates)) {
      const parts = data.candidates[0]?.content?.parts || [];
      return parts.map(p => p.text || '').join('\n').trim();
    }
    if (data.error) return '';
    return '';
  }

  function friendlyError(status, body) {
    const msg = (body && (body.error?.message || body.message)) || '';
    if (status === 400 && /api key/i.test(msg)) return 'API Key বৈধ নয়। সেটিংসে সঠিক Gemini key দিন।';
    if (status === 403) return 'API Key অনুমোদিত নয়। Google AI Studio থেকে নতুন key নিন।';
    if (status === 404) return 'মডেল আর সমর্থিত নয়। সেটিংস থেকে ভিন্ন মডেল বেছে নিন।';
    if (status === 429) return 'Rate limit ছাড়িয়ে গেছে। একটু অপেক্ষা করে আবার চেষ্টা করুন।';
    if (status >= 500) return 'Gemini সার্ভারে সমস্যা হচ্ছে। আবার চেষ্টা করুন।';
    return msg || ('অনুরোধ ব্যর্থ (' + status + ')');
  }

  const AI = {
    hasKey,
    getModel,

    /** Send a chat turn. history = [{role:'user'|'ai', text}] */
    async send(history, userText) {
      const key = getKey();
      if (!key) throw new Error('API Key সেট করা হয়নি।');

      const model = getModel();
      const lines = [C.SYSTEM_PROMPT, ''];
      for (const m of history) {
        lines.push((m.role === 'user' ? 'শিক্ষার্থী: ' : 'মেন্টর: ') + m.text);
      }
      lines.push('শিক্ষার্থী: ' + userText);
      lines.push('মেন্টর:');

      const url = C.GEMINI_INTERACTIONS_URL + '?key=' + encodeURIComponent(key);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify({ model, input: lines.join('\n') })
      });

      let data = null;
      try { data = await res.json(); } catch (_) { data = null; }

      if (!res.ok) {
        throw new Error(friendlyError(res.status, data));
      }

      const text = extractText(data);
      if (!text) throw new Error('এআই কোনো উত্তর দেয়নি। আবার চেষ্টা করুন।');
      return text;
    },

    /** Validate the API key with a tiny request. */
    async verify() {
      const key = getKey();
      if (!key) return { ok: false, message: 'Key খালি' };

      const model = getModel();
      const url = C.GEMINI_INTERACTIONS_URL + '?key=' + encodeURIComponent(key);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ model, input: 'ping' })
        });
        if (!res.ok) {
          let body = null;
          try { body = await res.json(); } catch (_) {}
          return { ok: false, message: friendlyError(res.status, body) };
        }
        return { ok: true, message: 'Key কাজ করছে ✓' };
      } catch (e) {
        return { ok: false, message: 'নেটওয়ার্ক সমস্যা: ' + e.message };
      }
    }
  };

  window.AI = AI;
})();
