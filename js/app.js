/* ============================================================
   BCS Verse — Application bootstrap & event wiring
   ============================================================ */
(function () {
  'use strict';

  const BCS = window.BCS;
  const UI = BCS.UI;
  const Store = BCS.Store;
  const C = BCS.CONFIG;
  const esc = BCS.escapeHtml;
  const bn = BCS.toBn;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------------- timers ---------------- */
  let liveTickerId = null;
  let tickSeconds = 0;

  function startTicker() {
    if (liveTickerId) clearInterval(liveTickerId);
    liveTickerId = setInterval(() => {
      const s = Store.state.session;
      if (s && s.running) {
        s.elapsed += 1;
        s.updatedAt = Date.now();
        tickSeconds += 1;
        if (tickSeconds % 20 === 0) {
          localStorage.setItem(Store.keys.session, JSON.stringify(s));
        }
        UI.renderFocus(Store.state);
        if (tickSeconds % 60 === 0 && Store.state.user) {
          const me = Store.state.live.find((u) => u.username === Store.state.user.username);
          if (me) {
            me.minutes = Math.max(1, Math.round(s.elapsed / 60));
            localStorage.setItem(Store.keys.live, JSON.stringify(Store.state.live));
            UI.renderLiveStrip(Store.state);
            UI.renderLeaderboard(Store.state);
          }
        }
      } else {
        tickSeconds = 0;
      }
    }, 1000);
  }

  /* ============================================================
     AUTH
     ============================================================ */
  function openAuthModal() {
    UI.modal.open({
      title: '👤 BCS Verse অ্যাকাউন্ট',
      body: `
        <p class="muted sm" style="margin-bottom:16px">
          অ্যাকাউন্ট শুধু আপনার ব্রাউজারে সংরক্ষিত হয় — কোনো সার্ভারে কিছু যায় না।
        </p>
        <label class="lbl" style="margin-top:0">পূর্ণ নাম</label>
        <input class="input" id="authName" placeholder="যেমন: তানভীর আহমেদ" maxlength="40" />
        <label class="lbl">ইউজারনেম</label>
        <input class="input" id="authUser" placeholder="যেমন: tanvir_bcs" maxlength="24" />
        <label class="lbl">লক্ষ্য (ঐচ্ছিক)</label>
        <input class="input" id="authTarget" placeholder="যেমন: ৫১তম বিসিএস • প্রশাসন" maxlength="50" />
      `,
      footer: `
        <button class="btn btn-ghost" data-close="1">বাতিল</button>
        <button class="btn btn-grad" id="authSubmit">শুরু করুন 🚀</button>`,
      onMount(body, root) {
        const submit = () => {
          const name = $('#authName', root).value.trim();
          const user = $('#authUser', root).value.trim().replace(/[^A-Za-z0-9_]/g, '');
          const target = $('#authTarget', root).value.trim();

          if (!name) return UI.toast('আপনার নাম লিখুন', 'err');
          if (user.length < 3) return UI.toast('ইউজারনেম অন্তত ৩ অক্ষরের হতে হবে (a-z, 0-9, _)', 'err');

          Store.signIn({ name, username: user, target });
          UI.modal.close();
          UI.toast('স্বাগতম, ' + name + '! 🎉', 'ok');
        };
        $('#authSubmit', root).addEventListener('click', submit);
        root.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      }
    });
  }

  function requireAuth(actionLabel) {
    if (Store.isLoggedIn()) return true;
    UI.toast('আগে অ্যাকাউন্ট খুলুন — ' + (actionLabel || 'এই কাজের জন্য'), 'info');
    openAuthModal();
    return false;
  }

  /* ============================================================
     LIVE STUDY
     ============================================================ */
  function openLiveModal() {
    if (!requireAuth('লাইভ স্টাডি শুরু করতে')) return;
    const cur = Store.state.session;
    if (cur) {
      UI.toast('আপনি ইতিমধ্যে একটি সেশনে আছেন', 'info');
      return;
    }

    UI.modal.open({
      title: '🔴 লাইভ স্টাডি সেশন',
      body: `
        <p class="muted sm" style="margin-bottom:14px">
          আপনি এখন কী পড়ছেন তা নেটওয়ার্কে দেখানো হবে — অন্যরা দেখে অনুপ্রাণিত হবে।
        </p>
        <label class="lbl" style="margin-top:0">বিষয় নির্বাচন করুন</label>
        <select class="input" id="liveSubject">
          ${BCS.SUBJECTS.map((s) => `<option value="${esc(s.name)}">${s.emoji} ${esc(s.name)}</option>`).join('')}
        </select>
        <div class="divider"></div>
        <p class="muted sm">⏱️ সেশন চলাকালীন টাইমার স্বয়ংক্রিয়ভাবে চলে। বিরতি নিলে লাইভ স্ট্যাটাস বন্ধ হবে না, শুধু টাইমার থামবে।</p>
      `,
      footer: `
        <button class="btn btn-ghost" data-close="1">বাতিল</button>
        <button class="btn btn-live" id="startLive">লাইভ শুরু করুন ⏱️</button>`,
      onMount(body, root) {
        $('#startLive', root).addEventListener('click', () => {
          const subject = $('#liveSubject', root).value;
          Store.startSession(subject);
          tickSeconds = 0;
          UI.modal.close();
          UI.toast('লাইভ সেশন শুরু হয়েছে — শুভকামনা! 🔥', 'ok');
          if (window.innerWidth <= 900) {
            $('#focusCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    });
  }

  function toggleFocus() {
    const s = Store.state.session;
    if (!s) return openLiveModal();
    if (s.running) {
      Store.pauseSession();
      UI.toast('সেশন বিরতিতে আছে ⏸', 'info');
    } else {
      Store.resumeSession();
      UI.toast('আবার শুরু! মনোযোগ ধরে রাখুন 💪', 'ok');
    }
  }

  function endFocus() {
    const s = Store.state.session;
    if (!s) return;

    UI.modal.open({
      title: 'সেশন শেষ করবেন?',
      width: '400px',
      body: `<p class="muted">আপনি <b style="color:var(--text)">${BCS.formatClock(s.elapsed)}</b> ধরে
             <b style="color:var(--text)">${esc(s.subject)}</b> পড়েছেন।</p>`,
      footer: `
        <button class="btn btn-ghost" data-close="1">চালিয়ে যান</button>
        <button class="btn btn-grad" id="confirmEnd">সেশন শেষ করুন</button>`,
      onMount(body, root) {
        $('#confirmEnd', root).addEventListener('click', () => {
          const res = Store.endSession();
          UI.modal.close();
          tickSeconds = 0;
          if (res && res.minutes >= 1) {
            UI.toast(`দারুণ! ${bn(res.minutes)} মিনিট পড়েছেন 🎯`, 'ok', 4200);
          }
          UI.renderAll(Store.state);
        });
      }
    });
  }

  /* ============================================================
     AI
     ============================================================ */
  const chatHistory = [];

  function openAIModal(prefill) {
    UI.modal.open({
      title: '🤖 BCS এআই মেন্টর',
      width: '640px',
      body: `
        <div class="chip-row" id="aiChips">
          <span class="tag" data-q="সংবিধানের ৭০ অনুচ্ছেদ সহজ বাংলায় ব্যাখ্যা করো">📜 অনুচ্ছেদ ৭০</span>
          <span class="tag" data-q="চর্যাপদ আবিষ্কারের ইতিহাস সংক্ষেপে বলো">📖 চর্যাপদ</span>
          <span class="tag" data-q="বাংলাদেশের অর্থনীতিতে রেমিট্যান্সের প্রভাব ব্যাখ্যা করো">💹 রেমিট্যান্স</span>
          <span class="tag" data-q="গাণিতিক যুক্তির সহজ টেকনিক শেখাও">🧮 গাণিতিক যুক্তি</span>
        </div>
        <div class="chat" id="aiChat"></div>
        <div class="chat-input-row">
          <textarea class="input" id="aiInput" rows="1" placeholder="আপনার প্রশ্ন লিখুন… (Enter = পাঠান)"></textarea>
          <button class="btn btn-grad" id="aiSend">
            <svg class="ic sm" viewBox="0 0 24 24"><path d="M4 12 20 4l-7 16-2.5-6.5L4 12Z"/></svg>
          </button>
        </div>
      `,
      onMount(body, root) {
        const chat = $('#aiChat', root);
        const input = $('#aiInput', root);
        const send = $('#aiSend', root);

        if (!chatHistory.length) {
          chatHistory.push({
            role: 'model',
            text: 'আসসালামু আলাইকুম! 👋 আমি আপনার বিসিএস এআই মেন্টর।\n\nযেকোনো বিষয়, অনুচ্ছেদ, সাহিত্য বা গাণিতিক সমস্যা নিয়ে প্রশ্ন করুন — বাংলায় বিস্তারিত উত্তর দেব।'
          });
        }

        function paint() {
          chat.innerHTML = chatHistory.map((m) => `
            <div class="msg ${m.role === 'user' ? 'user' : 'ai'}">
              ${m.role === 'user' ? BCS.avatarHtml(Store.state.user ? Store.state.user.name : 'আপনি', 'xs') : BCS.avatarHtml('AI', 'xs')}
              <div class="bubble">${esc(m.text)}</div>
            </div>`).join('');
          chat.scrollTop = chat.scrollHeight;
          const scroll = root.querySelector('.modal-body');
          if (scroll) scroll.scrollTop = scroll.scrollHeight;
        }

        function showTyping() {
          chat.insertAdjacentHTML('beforeend', `
            <div class="msg ai" id="typingMsg">
              ${BCS.avatarHtml('AI', 'xs')}
              <div class="bubble typing" style="padding:14px 16px"><i></i><i></i><i></i></div>
            </div>`);
          chat.scrollTop = chat.scrollHeight;
        }

        function hideTyping() {
          const t = $('#typingMsg', chat);
          if (t) t.remove();
        }

        async function ask(text) {
          const q = (text || '').trim();
          if (!q) return;

          chatHistory.push({ role: 'user', text: q });
          paint();
          input.value = '';
          input.style.height = 'auto';
          send.disabled = true;
          showTyping();

          try {
            const history = chatHistory.slice(0, -1).slice(-8);
            const answer = await BCS.AI.generate(history, q);
            hideTyping();
            chatHistory.push({ role: 'model', text: answer });
            paint();
          } catch (err) {
            hideTyping();
            const msg = BCS.AI.friendly(err);
            chatHistory.push({ role: 'model', text: msg });
            paint();
            if (err.code === BCS.AI.AIError.BAD_KEY || err.code === BCS.AI.AIError.NO_KEY) {
              UI.toast('API Key সমস্যা — সেটিংস খুলুন', 'err');
            }
          } finally {
            send.disabled = false;
            input.focus();
          }
        }

        send.addEventListener('click', () => ask(input.value));
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            ask(input.value);
          }
        });
        input.addEventListener('input', () => {
          input.style.height = 'auto';
          input.style.height = Math.min(input.scrollHeight, 140) + 'px';
        });

        $$('[data-q]', root).forEach((chip) => {
          chip.addEventListener('click', () => ask(chip.dataset.q));
        });

        paint();
        if (prefill) setTimeout(() => ask(prefill), 250);
      }
    });
  }

  async function generateMCQ() {
    UI.modal.open({
      title: '🎯 আজকের মডেল MCQ',
      width: '660px',
      body: `
        <div id="mcqBody">
          <div class="row gap" style="margin-bottom:14px">
            <span class="chip chip-indigo">${esc(Store.getModel())}</span>
            <span class="chip">৫টি প্রশ্ন</span>
            <span class="chip">উচ্চ-সম্ভাব্য</span>
          </div>
          <div class="sk" style="height:18px;margin-bottom:10px"></div>
          <div class="sk" style="height:18px;width:85%;margin-bottom:10px"></div>
          <div class="sk" style="height:18px;width:70%;margin-bottom:22px"></div>
          <div class="sk" style="height:18px;margin-bottom:10px"></div>
          <div class="sk" style="height:18px;width:75%"></div>
        </div>`,
      footer: `<button class="btn btn-ghost" data-close="1">বন্ধ করুন</button>
               <button class="btn btn-grad" id="copyMcq">📋 কপি করুন</button>`,
      onMount(body, root) {
        let fullText = '';
        BCS.AI.generate([], BCS.AI.mcqPrompt(5))
          .then((text) => {
            fullText = text;
            $('#mcqBody', root).innerHTML =
              `<div class="post-body" style="font-size:.92rem">${BCS.richText(text)}</div>`;
          })
          .catch((err) => {
            $('#mcqBody', root).innerHTML =
              `<div class="empty" style="padding:28px"><div class="em-ico">⚠️</div>
               <h3>তৈরি করা যায়নি</h3><p>${esc(BCS.AI.friendly(err))}</p></div>`;
          });

        $('#copyMcq', root).addEventListener('click', async () => {
          if (!fullText) return UI.toast('এখনো তৈরি হয়নি', 'info');
          try {
            await navigator.clipboard.writeText(fullText);
            UI.toast('কপি করা হয়েছে 📋', 'ok');
          } catch (e) {
            UI.toast('কপি করা যায়নি', 'err');
          }
        });
      }
    });
  }

  /* ============================================================
     SETTINGS
     ============================================================ */
  function openSettings() {
    const s = Store.state.settings;
    UI.modal.open({
      title: '⚙️ সেটিংস',
      body: `
        <h4 style="font-weight:700;font-size:.92rem;margin-bottom:6px">🔑 Gemini API Key</h4>
        <p class="muted sm" style="margin-bottom:10px">
          বিনামূল্যে key নিন <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener"
          style="color:#a5b4fc;text-decoration:underline">Google AI Studio</a> থেকে।
          Key শুধু আপনার ব্রাউজারে (localStorage) সংরক্ষিত থাকে।
        </p>
        <input class="input" id="setKey" type="password" placeholder="AIza…" value="${esc(s.apiKey || '')}" autocomplete="off" />
        <label class="lbl">মডেল</label>
        <select class="input" id="setModel">
          ${C.GEMINI_MODELS.map((m) => `<option value="${m}" ${m === Store.getModel() ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <div class="row gap" style="margin-top:12px">
          <button class="btn btn-ghost sm" id="testKey">🔍 Key যাচাই করুন</button>
          <span class="muted sm" id="keyStatus"></span>
        </div>
        <div class="divider"></div>
        <h4 style="font-weight:700;font-size:.92rem;margin-bottom:10px">🧹 ডেটা</h4>
        <div class="row gap wrap">
          <button class="btn btn-ghost sm" id="exportData">⬇️ ডেটা এক্সপোর্ট</button>
          <button class="btn btn-ghost sm" id="resetData">🗑️ সব ডেটা মুছুন</button>
        </div>
        <p class="muted sm" style="margin-top:10px">সংস্করণ 2.1 • Gemini Interactions API • সমস্ত ডেটা আপনার ডিভাইসেই থাকে</p>
      `,
      footer: `<button class="btn btn-ghost" data-close="1">বাতিল</button>
               <button class="btn btn-grad" id="saveSettings">সংরক্ষণ করুন</button>`,
      onMount(body, root) {
        $('#saveSettings', root).addEventListener('click', () => {
          Store.saveSettings({
            apiKey: $('#setKey', root).value.trim(),
            model: $('#setModel', root).value
          });
          UI.modal.close();
          UI.toast('সেটিংস সংরক্ষিত ✅', 'ok');
          UI.updateAIChip();
        });

        $('#testKey', root).addEventListener('click', async () => {
          const status = $('#keyStatus', root);
          const key = $('#setKey', root).value.trim();
          if (!key) return (status.textContent = 'Key দিন');
          Store.saveSettings({ apiKey: key, model: $('#setModel', root).value });
          status.textContent = 'যাচাই হচ্ছে…';
          status.style.color = '';
          const r = await BCS.AI.verifyKey();
          status.textContent = r.ok ? '✅ কাজ করছে' : '❌ ' + r.message;
          status.style.color = r.ok ? '#34d399' : '#f87171';
        });

        $('#exportData', root).addEventListener('click', () => {
          const dump = {
            user: Store.state.user,
            posts: Store.state.posts,
            stats: Store.state.stats,
            exportedAt: new Date().toISOString()
          };
          const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'bcsverse-backup.json';
          a.click();
          URL.revokeObjectURL(a.href);
          UI.toast('ব্যাকআপ ডাউনলোড হয়েছে', 'ok');
        });

        $('#resetData', root).addEventListener('click', () => {
          if (!confirm('সব ডেটা মুছে যাবে। নিশ্চিত?')) return;
          Object.values(Store.keys).forEach((k) => localStorage.removeItem(k));
          location.reload();
        });
      }
    });
  }

  /* ============================================================
     PROFILE
     ============================================================ */
  function openProfile() {
    if (!requireAuth('প্রোফাইল দেখতে')) return;
    const u = Store.state.user;
    const st = Store.state.stats;
    const myPosts = Store.userPosts();

    UI.modal.open({
      title: '👤 প্রোফাইল',
      body: `
        <div class="row gap" style="margin-bottom:18px">
          ${BCS.avatarHtml(u.name, 'lg')}
          <div style="min-width:0">
            <div style="font-weight:800;font-size:1.15rem">${esc(u.name)}</div>
            <div class="muted sm">@${esc(u.username)}</div>
            <div class="chip chip-indigo" style="margin-top:6px">🎯 ${esc(u.target)}</div>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat"><b>${bn(st.streak || 0)}</b><span>দিন স্ট্রিক</span></div>
          <div class="stat"><b>${bn(Math.floor((st.totalMinutes || 0) / 60))}</b><span>ঘণ্টা পড়া</span></div>
          <div class="stat"><b>${bn(st.sessions || 0)}</b><span>সেশন</span></div>
          <div class="stat"><b>${bn(myPosts.length)}</b><span>পোস্ট</span></div>
        </div>
        <div class="divider"></div>
        <h4 style="font-weight:700;font-size:.92rem;margin-bottom:10px">📝 সাম্প্রতিক পোস্ট</h4>
        ${myPosts.length
          ? myPosts.slice(0, 3).map((p) => `
              <div style="padding:11px 13px;border-radius:12px;background:var(--surface-3);margin-bottom:8px">
                <div class="muted" style="font-size:.72rem;margin-bottom:4px">${BCS.relTime(p.ts)}</div>
                <div style="font-size:.88rem;color:var(--text-2)">${esc(p.content.slice(0, 130))}${p.content.length > 130 ? '…' : ''}</div>
              </div>`).join('')
          : '<p class="muted sm">এখনো কোনো পোস্ট নেই।</p>'}
      `,
      footer: `
        <button class="btn btn-ghost" data-action="signout">লগআউট</button>
        <button class="btn btn-grad" data-close="1">ঠিক আছে</button>`,
      onMount(body, root) {
        const out = root.querySelector('[data-action="signout"]');
        if (out) out.addEventListener('click', () => {
          Store.goOffline();
          Store.signOut();
          UI.modal.close();
          UI.toast('লগআউট সম্পন্ন', 'info');
        });
      }
    });
  }

  /* ============================================================
     FEED INTERACTIONS
     ============================================================ */
  function handlePost() {
    if (!requireAuth('পোস্ট করতে')) return;
    const box = $('#postText');
    const text = box.value.trim();
    if (!text) return UI.toast('কিছু লিখুন', 'err');
    if (text.length > C.MAX_POST_LEN) return UI.toast('অনেক লম্বা হয়ে গেছে', 'err');

    Store.addPost(text);
    box.value = '';
    updateCounter();
    UI.toast('পোস্ট প্রকাশিত হয়েছে 🚀', 'ok');
  }

  function updateCounter() {
    const box = $('#postText');
    const c = $('#postCounter');
    if (!box || !c) return;
    c.textContent = bn(box.value.length) + '/' + bn(C.MAX_POST_LEN);
  }

  function sharePost(id) {
    const p = Store.state.posts.find((x) => x.id === id);
    if (!p) return;
    const text = p.content.slice(0, 180) + '\n\n— BCS Verse';
    if (navigator.share) {
      navigator.share({ title: 'BCS Verse', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text)
        .then(() => UI.toast('কপি করা হয়েছে 📋', 'ok'))
        .catch(() => UI.toast('কপি করা যায়নি', 'err'));
    }
  }

  function openPostMenu(id) {
    const p = Store.state.posts.find((x) => x.id === id);
    if (!p) return;
    const isMine = Store.state.user && p.username === Store.state.user.username;

    UI.modal.open({
      title: 'পোস্ট অপশন',
      width: '400px',
      body: `
        <button class="btn btn-ghost btn-block" data-m="copy" style="justify-content:flex-start">📋 টেক্সট কপি করুন</button>
        <button class="btn btn-ghost btn-block" data-m="ai" style="justify-content:flex-start;margin-top:8px">✨ এআই দিয়ে সারসংক্ষেপ</button>
        <button class="btn btn-ghost btn-block" data-m="share" style="justify-content:flex-start;margin-top:8px">🔗 শেয়ার করুন</button>
        ${isMine ? `<button class="btn btn-ghost btn-block" data-m="delete" style="justify-content:flex-start;margin-top:8px;color:#f87171">🗑️ পোস্ট মুছুন</button>` : ''}
      `,
      onMount(body, root) {
        body.addEventListener('click', (e) => {
          const b = e.target.closest('[data-m]');
          if (!b) return;
          const m = b.dataset.m;
          UI.modal.close();

          if (m === 'copy') {
            navigator.clipboard.writeText(p.content).then(() => UI.toast('কপি হয়েছে 📋', 'ok'));
          } else if (m === 'share') {
            sharePost(id);
          } else if (m === 'delete') {
            Store.deletePost(id);
            UI.toast('পোস্ট মুছে ফেলা হয়েছে', 'info');
          } else if (m === 'ai') {
            UI.modal.open({
              title: '✨ এআই সারসংক্ষেপ',
              body: '<div class="sk" style="height:18px;margin-bottom:10px"></div><div class="sk" style="height:18px;width:80%"></div>',
              onMount(b2) {
                BCS.AI.generate([], BCS.AI.summarizePrompt(p.content))
                  .then((t) => { b2.innerHTML = `<div class="post-body">${BCS.richText(t)}</div>`; })
                  .catch((err) => {
                    b2.innerHTML = `<div class="empty" style="padding:28px"><div class="em-ico">⚠️</div>
                      <p>${esc(BCS.AI.friendly(err))}</p></div>`;
                  });
              }
            });
          }
        });
      }
    });
  }

  /* ============================================================
     GLOBAL EVENT DELEGATION
     ============================================================ */
  function bindEvents() {
    document.addEventListener('click', (e) => {
      const actEl = e.target.closest('[data-action]');
      if (actEl) {
        const action = actEl.dataset.action;
        switch (action) {
          case 'auth': openAuthModal(); return;
          case 'signout':
            Store.goOffline();
            Store.signOut();
            UI.toast('লগআউট সম্পন্ন', 'info');
            return;
          case 'open-live': openLiveModal(); return;
          case 'open-ai': openAIModal(); return;
          case 'open-profile': openProfile(); return;
          case 'open-settings': openSettings(); return;
          case 'ai-mcq': generateMCQ(); return;
          case 'focus-toggle': toggleFocus(); return;
          case 'focus-end': endFocus(); return;
          case 'post': handlePost(); return;
          case 'toggle-theme': {
            const t = Store.toggleTheme();
            UI.toast(t === 'dark' ? 'ডার্ক থিম 🌙' : 'লাইট থিম ☀️', 'info', 2000);
            return;
          }
          case 'go-home':
            document.querySelectorAll('.nav-item, .tab-item').forEach((n) => n.classList.remove('is-active'));
            actEl.classList.add('is-active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          case 'insert-tag': {
            const box = $('#postText');
            box.value = (box.value.trim() + ' #' + actEl.dataset.tag).trim() + ' ';
            updateCounter();
            box.focus();
            return;
          }
          case 'topic': {
            const box = $('#postText');
            box.value = '#' + actEl.dataset.tag.replace(/\s+/g, '_') + ' বিষয়ে: ';
            updateCounter();
            box.focus();
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
      }

      const postAct = e.target.closest('[data-action][data-id]');
      if (postAct) {
        const action = postAct.dataset.action;
        const id = postAct.dataset.id;
        if (action === 'like') {
          if (!requireAuth('লাইক করতে')) return;
          Store.toggleLike(id);
          return;
        }
        if (action === 'save') {
          if (!requireAuth('সেভ করতে')) return;
          const s = Store.toggleSave(id);
          UI.toast(s ? 'সেভ করা হয়েছে 🔖' : 'সেভ থেকে সরানো হয়েছে', 'info', 1800);
          return;
        }
        if (action === 'share') { sharePost(id); return; }
        if (action === 'delete') { Store.deletePost(id); UI.toast('মুছে ফেলা হয়েছে', 'info'); return; }
        if (action === 'toggle-comments') {
          const box = document.getElementById('cmt-' + id);
          if (box) box.classList.toggle('open');
          return;
        }
        if (action === 'add-comment') {
          if (!requireAuth('কমেন্ট করতে')) return;
          const input = document.querySelector(`[data-cmt-input="${id}"]`);
          const text = input ? input.value.trim() : '';
          if (!text) return UI.toast('কমেন্ট লিখুন', 'err');
          Store.addComment(id, text);
          const box = document.getElementById('cmt-' + id);
          if (box) box.classList.add('open');
          return;
        }
        if (action === 'post-menu') { openPostMenu(id); return; }
      }

      const hash = e.target.closest('.hash');
      if (hash) {
        const tag = hash.dataset.tag.replace('#', '');
        $('#feedSearch').value = tag;
        UI.query = tag.toLowerCase();
        UI.filter = 'all';
        $$('#feedTabs .tab').forEach((t) => t.classList.toggle('is-active', t.dataset.filter === 'all'));
        UI.renderFeed(Store.state);
        $('#feedSearch').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    document.addEventListener('keydown', (e) => {
      const typing = /input|textarea|select/i.test((e.target.tagName || ''));
      if (typing || UI.modal.isOpen()) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); $('#postText').focus(); }
      if (e.key === 'l' || e.key === 'L') { e.preventDefault(); openLiveModal(); }
      if (e.key === 'k' || e.key === 'K') { e.preventDefault(); openAIModal(); }
    });

    const postText = $('#postText');
    postText.addEventListener('input', updateCounter);
    postText.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handlePost();
    });

    $('#feedTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      $$('#feedTabs .tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      UI.filter = tab.dataset.filter;
      UI.renderFeed(Store.state);
    });

    $('#feedSearch').addEventListener('input', BCS.debounce((e) => {
      UI.query = e.target.value;
      UI.renderFeed(Store.state);
    }, 180));

    document.addEventListener('keydown', (e) => {
      const inp = e.target.closest('[data-cmt-input]');
      if (inp && e.key === 'Enter') {
        e.preventDefault();
        const id = inp.dataset.cmtInput;
        const text = inp.value.trim();
        if (!text) return;
        if (!requireAuth('কমেন্ট করতে')) return;
        Store.addComment(id, text);
      }
    });

    $$('.brand').forEach((b) => b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })));
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    Store.init();

    UI.renderSubjectSelect();
    UI.renderTopics();
    UI.renderQuickTags();
    updateCounter();
    UI.renderAll(Store.state);
    bindEvents();
    startTicker();

    $('#year').textContent = bn(new Date().getFullYear());

    Store.subscribe(() => UI.renderAll(Store.state));

    if (!localStorage.getItem(BCS.CONFIG.STORAGE_PREFIX + 'welcomed')) {
      localStorage.setItem(BCS.CONFIG.STORAGE_PREFIX + 'welcomed', '1');
      setTimeout(() => UI.toast('স্বাগতম! শর্টকাট: N = নতুন পোস্ট, L = লাইভ, K = এআই', 'info', 6000), 900);
    }

    UI.updateAIChip();

    window.addEventListener('beforeunload', (e) => {
      if (Store.state.session && Store.state.session.running) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
