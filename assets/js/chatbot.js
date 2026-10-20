/*
 * Site AI assistant widget.
 * Reads its settings from <div id="site-chat" data-...> (added to every page
 * by _plugins/site_extras.rb when chatbot.endpoint is set in _config.yml)
 * and talks to the Cloudflare Worker in chatbot-worker/.
 *
 * - A round button sits in the bottom-right corner.
 * - Once per visit, a short teaser bubble slides out after a few seconds.
 * - The conversation is kept for the browser tab session, so it survives
 *   moving between pages. Nothing is stored on a server by this site.
 */
(function () {
  "use strict";

  var root = document.getElementById("site-chat");
  if (!root) return;

  var cfg = {
    endpoint: root.getAttribute("data-endpoint"),
    name: root.getAttribute("data-name") || "AI assistant",
    teaser: root.getAttribute("data-teaser") || "",
    email: root.getAttribute("data-email") || "",
    avatar: root.getAttribute("data-avatar") || "",
    headline: root.getAttribute("data-headline") || "",
    delay: Math.max(0, parseFloat(root.getAttribute("data-teaser-delay") || "6")) * 1000,
    suggestions: (root.getAttribute("data-suggestions") || "").split("|").filter(Boolean),
  };
  if (!cfg.endpoint) return;

  var STORE_KEY = "site-chat-v1";
  var MAX_HISTORY = 12;

  // ---------- storage (best effort; private windows may block it) ----------
  function load() {
    try {
      return JSON.parse(sessionStorage.getItem(STORE_KEY)) || {};
    } catch (_) {
      return {};
    }
  }
  function save(state) {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (_) {
      /* ignore */
    }
  }
  var state = load();
  state.messages = Array.isArray(state.messages) ? state.messages : [];

  // ---------- helpers ----------
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs)
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") n.textContent = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else n.setAttribute(k, attrs[k]);
      });
    (children || []).forEach(function (c) {
      if (c) n.appendChild(c);
    });
    return n;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Minimal, safe formatting for replies: **bold**, "- " bullets, links, emails, paragraphs.
  function format(text) {
    var safe = escapeHtml(text);
    safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    safe = safe.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    safe = safe.replace(/(^|[\s(])([\w.+-]+@[\w-]+\.[\w.-]*\w)/g, '$1<a href="mailto:$2">$2</a>');
    var blocks = safe.split(/\n{2,}/);
    return blocks
      .map(function (b) {
        var lines = b.split("\n");
        if (
          lines.every(function (l) {
            return /^\s*[-*•]\s+/.test(l) || !l.trim();
          })
        ) {
          return (
            "<ul>" +
            lines
              .filter(function (l) {
                return l.trim();
              })
              .map(function (l) {
                return "<li>" + l.replace(/^\s*[-*•]\s+/, "") + "</li>";
              })
              .join("") +
            "</ul>"
          );
        }
        return "<p>" + lines.join("<br>") + "</p>";
      })
      .join("");
  }

  // ---------- build the widget ----------
  var launcher = el("button", { type: "button", class: "chat-launcher", "aria-label": "Chat with " + cfg.name, "aria-expanded": "false" }, [
    el("span", {
      class: "chat-launcher-icon",
      "aria-hidden": "true",
      html: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.1A8 8 0 1 1 21 12z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/></svg>',
    }),
    el("span", {
      class: "chat-launcher-close",
      "aria-hidden": "true",
      html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    }),
  ]);

  var teaserClose = el("button", { type: "button", class: "chat-teaser-close", "aria-label": "Dismiss", text: "×" });
  var teaser = el("div", { class: "chat-teaser", role: "status", hidden: "" }, [
    el("button", { type: "button", class: "chat-teaser-body" }, [el("span", { text: cfg.teaser })]),
    teaserClose,
  ]);

  var log = el("div", { class: "chat-log", role: "log", "aria-live": "polite", "aria-relevant": "additions" });
  var chips = el("div", { class: "chat-suggestions" });
  var input = el("textarea", {
    class: "chat-input",
    rows: "1",
    maxlength: "1000",
    placeholder: "Ask about Dammy's experience…",
    "aria-label": "Your question",
  });
  var send = el("button", {
    type: "submit",
    class: "chat-send",
    "aria-label": "Send",
    html: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  });
  var form = el("form", { class: "chat-form" }, [input, send]);
  var closeBtn = el("button", {
    type: "button",
    class: "chat-close",
    "aria-label": "Close chat",
    html: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  });
  var resetBtn = el("button", { type: "button", class: "chat-reset", text: "New chat" });

  var header = el("div", { class: "chat-header" }, [
    cfg.avatar ? el("img", { class: "chat-avatar", src: cfg.avatar, alt: "", width: "36", height: "36", loading: "lazy" }) : null,
    el("div", { class: "chat-title" }, [el("strong", { text: "Ask about Dammy" }), el("span", { text: "AI assistant · answers from this site" })]),
    resetBtn,
    closeBtn,
  ]);
  var note = el("p", {
    class: "chat-note",
    text: "AI answers based on this site. They can be imperfect, so confirm details with Dammy.",
  });
  var panel = el("div", { class: "chat-panel", role: "dialog", "aria-modal": "false", "aria-label": "Chat with " + cfg.name, hidden: "" }, [
    header,
    log,
    chips,
    form,
    note,
  ]);

  root.appendChild(teaser);
  root.appendChild(panel);
  root.appendChild(launcher);
  document.documentElement.classList.add("has-site-chat");

  // ---------- rendering ----------
  function addBubble(role, text, extraClass) {
    var b = el("div", { class: "chat-msg chat-" + role + (extraClass ? " " + extraClass : "") });
    if (role === "assistant") b.innerHTML = format(text);
    else b.textContent = text;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  function renderChips() {
    chips.innerHTML = "";
    if (state.messages.length) {
      chips.hidden = true;
      return;
    }
    chips.hidden = false;
    cfg.suggestions.forEach(function (q) {
      var c = el("button", { type: "button", class: "chat-chip", text: q });
      c.addEventListener("click", function () {
        ask(q);
      });
      chips.appendChild(c);
    });
  }

  function renderAll() {
    log.innerHTML = "";
    addBubble(
      "assistant",
      "Hi! I can answer questions about Dammy's experience, skills, projects, and education. What would you like to know?",
      "chat-welcome"
    );
    state.messages.forEach(function (m) {
      addBubble(m.role, m.content);
    });
    renderChips();
  }

  // ---------- open / close ----------
  var isOpen = false;
  function open(focusInput) {
    if (isOpen) return;
    isOpen = true;
    hideTeaser(true);
    panel.hidden = false;
    root.classList.add("is-open");
    launcher.setAttribute("aria-expanded", "true");
    launcher.setAttribute("aria-label", "Close chat");
    renderAll();
    state.open = true;
    save(state);
    requestAnimationFrame(function () {
      panel.classList.add("is-visible");
      if (focusInput !== false) input.focus({ preventScroll: true });
    });
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove("is-visible");
    root.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "Chat with " + cfg.name);
    state.open = false;
    save(state);
    setTimeout(function () {
      if (!isOpen) panel.hidden = true;
    }, 200);
    launcher.focus({ preventScroll: true });
  }

  launcher.addEventListener("click", function () {
    isOpen ? close() : open();
  });
  closeBtn.addEventListener("click", close);
  resetBtn.addEventListener("click", function () {
    state.messages = [];
    save(state);
    renderAll();
    input.focus();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) close();
  });

  // ---------- teaser ----------
  var teaserTimer = null;
  function hideTeaser(remember) {
    clearTimeout(teaserTimer);
    teaser.classList.remove("is-visible");
    setTimeout(function () {
      teaser.hidden = true;
    }, 250);
    if (remember) {
      state.teaserSeen = true;
      save(state);
    }
  }
  teaser.querySelector(".chat-teaser-body").addEventListener("click", function () {
    open();
  });
  teaserClose.addEventListener("click", function () {
    hideTeaser(true);
  });
  if (!state.teaserSeen && !state.open) {
    teaserTimer = setTimeout(function () {
      if (isOpen) return;
      teaser.hidden = false;
      requestAnimationFrame(function () {
        teaser.classList.add("is-visible");
      });
      state.teaserSeen = true;
      save(state);
      // Tuck it away again after a while so it never nags.
      teaserTimer = setTimeout(function () {
        hideTeaser(false);
      }, 14000);
    }, cfg.delay);
  }

  // ---------- sending ----------
  var busy = false;
  function setBusy(v) {
    busy = v;
    send.disabled = v;
    input.disabled = v;
    root.classList.toggle("is-busy", v);
  }

  function ask(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    if (!isOpen) open(false);
    chips.hidden = true;
    state.messages.push({ role: "user", content: text.slice(0, 1000) });
    state.messages = state.messages.slice(-MAX_HISTORY);
    save(state);
    addBubble("user", text);
    input.value = "";
    autosize();
    var typing = addBubble("assistant", "", "chat-typing");
    typing.innerHTML = "<span></span><span></span><span></span>";
    typing.setAttribute("aria-label", "Assistant is typing");
    setBusy(true);

    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, 45000);

    fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: state.messages }),
      signal: controller ? controller.signal : undefined,
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            if (!res.ok || !data.reply) throw new Error(data.error || "HTTP " + res.status);
            return data.reply;
          });
      })
      .then(function (reply) {
        typing.remove();
        state.messages.push({ role: "assistant", content: reply });
        state.messages = state.messages.slice(-MAX_HISTORY);
        save(state);
        addBubble("assistant", reply);
      })
      .catch(function (err) {
        typing.remove();
        // Drop the unanswered question so a retry starts cleanly.
        state.messages.pop();
        save(state);
        var msg =
          err && err.message && !/^HTTP|Failed to fetch|NetworkError|aborted|Load failed/i.test(err.message)
            ? err.message
            : "Sorry, I couldn't reach the assistant just now." + (cfg.email ? " You can email Dammy at " + cfg.email + "." : "");
        addBubble("assistant", msg, "chat-error");
      })
      .then(function () {
        clearTimeout(timer);
        setBusy(false);
        input.focus({ preventScroll: true });
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      ask(input.value);
    }
  });
  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }
  input.addEventListener("input", autosize);

  // Re-open across page loads if the visitor left it open.
  // (Desktop only: on phones the panel would cover the page you just opened.)
  if (state.open && window.matchMedia("(min-width: 768px)").matches) open(false);
})();
