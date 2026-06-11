/* =========================================================================
   main.js — shared site logic
   - Injects the sidebar nav + sticky top bar + footer (DRY)
   - Loads content + translations from /data/*.json
   - Language dropdown (persisted) + live Uzbekistan clock
   - Collapsible sidebar (persisted) with icon-only rail
   - Off-canvas drawer on mobile (hamburger left, download right)
   - Download-CV bottom sheet with language choice
   ========================================================================= */

const LANGS = ["en", "ru", "uz"];
const DEFAULT_LANG = "en";
const LANG_KEY = "site.lang";
const COLLAPSE_KEY = "site.sidebar";
const THEME_KEY = "site.theme";
const DEFAULT_THEME = "dark";
const BREAKPOINT = 880; // keep in sync with the CSS drawer breakpoint

/* ---------- icons (inline SVG, inherit currentColor) ---------- */

const I = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  projects:
    '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  experience:
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
  contact: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  links:
    '<path d="m9 15 6-6"/><path d="M8.5 10.5l-2 2a3.5 3.5 0 0 0 5 5l2-2"/><path d="M15.5 13.5l2-2a3.5 3.5 0 0 0-5-5l-2 2"/>',
  blog: '<path d="M5 3h9l5 5v13H5z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h8"/>',
};

const svg = (paths, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const ICON_GLOBE = svg(
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/>',
  "lang__icon"
);
const ICON_CHEVRON = svg('<path d="m6 9 6 6 6-6"/>', "lang__chev");
const ICON_COLLAPSE = svg('<path d="m11 7-5 5 5 5M18 7l-5 5 5 5"/>');
const ICON_DOWNLOAD = svg('<path d="M12 3v12"/><path d="m7 11 5 4 5-4"/><path d="M5 21h14"/>');
const ICON_MOON = svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>');
const ICON_SUN = svg(
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'
);

// Nav order shared across all pages.
const NAV_ITEMS = [
  { key: "nav.home", href: "index.html", icon: I.home },
  { key: "nav.projects", href: "projects.html", icon: I.projects },
  { key: "nav.experience", href: "experience.html", icon: I.experience },
  { key: "nav.contact", href: "contact.html", icon: I.contact },
  { key: "nav.blog", href: "blog.html", icon: I.blog },
];

let I18N = {};
let CONTENT = {};
let currentLang = DEFAULT_LANG;

/* ---------- data loading ---------- */

async function loadData() {
  const [i18n, content] = await Promise.all([
    fetch("data/i18n.json").then((r) => r.json()),
    fetch("data/content.json").then((r) => r.json()),
  ]);
  I18N = i18n;
  CONTENT = content;
}

/* ---------- translation helpers ---------- */

function t(key) {
  const dict = I18N[currentLang] || I18N[DEFAULT_LANG] || {};
  return dict[key] != null ? dict[key] : key;
}

function getStoredLang() {
  const saved = localStorage.getItem(LANG_KEY);
  return LANGS.includes(saved) ? saved : DEFAULT_LANG;
}

function setLang(lang) {
  if (!LANGS.includes(lang)) lang = DEFAULT_LANG;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  applyTranslations();
  syncLangSwitcher();
  // let page-specific scripts (e.g. experience.js) re-render their content
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.getAttribute("data-i18n-attr")
      .split(",")
      .forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
  });

  const titleKey = document.body.getAttribute("data-title-key");
  const siteName = t("site.title");
  document.title = titleKey ? `${t(titleKey)} · ${siteName}` : siteName;
}

/* ---------- sidebar / topbar / footer injection ---------- */

function buildSidebar() {
  const el = document.getElementById("site-sidebar");
  if (!el) return;

  const active = document.body.getAttribute("data-page");

  const links = NAV_ITEMS.map((item) => {
    const cur = item.href === active ? ' aria-current="page"' : "";
    return `<li>
        <a class="nav__link" href="${item.href}"${cur}
           title="${t(item.key)}" data-i18n-attr="title:${item.key}">
          <span class="nav__icon">${svg(item.icon)}</span>
          <span class="nav__label" data-i18n="${item.key}">${t(item.key)}</span>
        </a>
      </li>`;
  }).join("");

  const options = LANGS.map(
    (l) => `
      <li role="none">
        <button class="lang__option" role="option" type="button" data-lang="${l}">
          <span class="lang__code">${l.toUpperCase()}</span>
          <span class="lang__name">${(I18N[l] && I18N[l]["meta.langName"]) || l}</span>
        </button>
      </li>`
  ).join("");

  el.innerHTML = `
    <div class="sidebar__top">
      <span class="brand" data-i18n="site.title">${t("site.title")}</span>
      <button class="sidebar__collapse" type="button"
              data-i18n-attr="aria-label:nav.toggleSidebar" title="${t("nav.toggleSidebar")}">
        ${ICON_COLLAPSE}
      </button>
    </div>

    <nav class="nav" aria-label="Primary">
      <ul class="nav__list">${links}</ul>
    </nav>

    <div class="sidebar__bottom">
      <button class="theme" type="button" role="switch" aria-checked="true"
              data-i18n-attr="aria-label:theme.toggle" title="${t("theme.toggle")}">
        <span class="theme__icon">${ICON_MOON}</span>
        <span class="theme__label" data-i18n="theme.dark">${t("theme.dark")}</span>
        <span class="theme__track" aria-hidden="true"><span class="theme__knob"></span></span>
      </button>

      <div class="lang" id="lang">
        <button class="lang__btn" type="button" aria-haspopup="listbox" aria-expanded="false"
                data-i18n-attr="aria-label:nav.language">
          ${ICON_GLOBE}
          <span class="lang__current">${currentLang.toUpperCase()}</span>
          ${ICON_CHEVRON}
        </button>
        <ul class="lang__menu" role="listbox" tabindex="-1">${options}</ul>
      </div>
    </div>
  `;
}

function buildTopbar() {
  const el = document.getElementById("site-topbar");
  if (!el) return;
  el.innerHTML = `
    <div class="topbar__left">
      <button class="nav__toggle" type="button" aria-expanded="false"
              aria-controls="site-sidebar" data-i18n-attr="aria-label:nav.menu">
        <span class="nav__toggle-bar"></span>
        <span class="nav__toggle-bar"></span>
        <span class="nav__toggle-bar"></span>
      </button>
      <div class="clock" aria-live="off">
        <span class="clock__label">
          <span data-i18n="time.label"></span> · <span data-i18n="time.place"></span>
        </span>
        <span class="clock__time" id="clock-time">—</span>
      </div>
    </div>

    <div class="topbar__right">
      <button class="cv-btn" id="cv-open" type="button" data-i18n-attr="aria-label:cv.download">
        ${ICON_DOWNLOAD}
        <span class="cv-btn__label" data-i18n="cv.download"></span>
        <span class="cv-btn__short" data-i18n="cv.short"></span>
      </button>
    </div>
  `;
}

function buildFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  const year = new Date().getFullYear();
  el.innerHTML = `
    <p class="footer__line">© <span>${year}</span> ${CONTENT.profile.name}. <span data-i18n="footer.rights">${t("footer.rights")}</span></p>
    <p class="footer__line footer__muted" data-i18n="footer.built">${t("footer.built")}</p>
  `;
}

function buildSheet() {
  if (document.getElementById("cv-sheet")) return;
  const options = LANGS.map(
    (l) => `
      <button class="cv-opt" type="button" data-lang="${l}">
        <span class="lang__code">${l.toUpperCase()}</span>
        <span>${(I18N[l] && I18N[l]["meta.langName"]) || l}</span>
      </button>`
  ).join("");

  const sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.id = "cv-sheet";
  sheet.hidden = true;
  sheet.innerHTML = `
    <div class="sheet__scrim" data-close></div>
    <div class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="cv-sheet-title">
      <span class="sheet__handle"></span>
      <h2 class="sheet__title" id="cv-sheet-title" data-i18n="cv.sheetTitle"></h2>
      <p class="sheet__hint" data-i18n="cv.sheetHint"></p>
      <div class="sheet__options">${options}</div>
      <a class="btn btn--primary sheet__download" id="cv-download" data-i18n="cv.confirm"></a>
    </div>
  `;
  document.body.appendChild(sheet);
}

/* ---------- interactions ---------- */

function wireDrawer() {
  const toggle = document.querySelector(".nav__toggle");
  const sidebar = document.getElementById("site-sidebar");
  const scrim = document.getElementById("scrim");
  if (!toggle || !sidebar) return;

  const open = () => {
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () =>
    document.body.classList.contains("nav-open") ? close() : open()
  );
  if (scrim) scrim.addEventListener("click", close);
  sidebar.addEventListener("click", (e) => {
    if (e.target.closest(".nav__link")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > BREAKPOINT) close();
  });
}

/* ---------- theme (dark mode) ---------- */

function getStoredTheme() {
  const s = localStorage.getItem(THEME_KEY);
  return s === "light" || s === "dark" ? s : DEFAULT_THEME;
}

function applyTheme(theme) {
  theme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  const btn = document.querySelector(".theme");
  if (btn) {
    btn.setAttribute("aria-checked", String(theme === "dark"));
    const icon = btn.querySelector(".theme__icon");
    if (icon) icon.innerHTML = theme === "dark" ? ICON_MOON : ICON_SUN;
  }
}

function wireTheme() {
  const btn = document.querySelector(".theme");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    applyTheme(next);
  });
}

function wireCollapse() {
  const btn = document.querySelector(".sidebar__collapse");
  if (!btn) return;
  btn.addEventListener("click", () => {
    // class lives on <html> (set pre-paint by the inline head script)
    const collapsed = document.documentElement.classList.toggle("sidebar-collapsed");
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "collapsed" : "expanded");
  });
}

function applyStoredCollapse() {
  // Normally already applied pre-paint by the inline <head> script; this is a
  // no-op fallback (kept in sync, won't animate since the class is unchanged).
  if (localStorage.getItem(COLLAPSE_KEY) === "collapsed") {
    document.documentElement.classList.add("sidebar-collapsed");
  }
}

function wireLangSwitcher() {
  const lang = document.getElementById("lang");
  if (!lang) return;
  const btn = lang.querySelector(".lang__btn");

  const closeMenu = () => {
    lang.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = lang.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  });
  lang.querySelectorAll(".lang__option").forEach((opt) => {
    opt.addEventListener("click", () => {
      setLang(opt.getAttribute("data-lang"));
      closeMenu();
    });
  });
  document.addEventListener("click", (e) => {
    if (!lang.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
}

function syncLangSwitcher() {
  document.querySelectorAll(".lang__option").forEach((btn) => {
    btn.classList.toggle(
      "is-active",
      btn.getAttribute("data-lang") === currentLang
    );
  });
  const current = document.querySelector(".lang__current");
  if (current) current.textContent = currentLang.toUpperCase();
}

/* ---------- download CV bottom sheet ---------- */

function wireSheet() {
  const sheet = document.getElementById("cv-sheet");
  const openBtn = document.getElementById("cv-open");
  const dl = document.getElementById("cv-download");
  if (!sheet || !openBtn || !dl) return;

  const select = (lang) => {
    const entry = CONTENT.cv[lang] || CONTENT.cv[DEFAULT_LANG];
    sheet.querySelectorAll(".cv-opt").forEach((o) =>
      o.classList.toggle("is-active", o.getAttribute("data-lang") === lang)
    );
    dl.setAttribute("href", entry.file);
    dl.setAttribute("download", entry.downloadName || "");
  };

  const open = () => {
    select(currentLang); // default to the active site language
    sheet.hidden = false;
    requestAnimationFrame(() => {
      sheet.classList.add("is-open");
      document.body.classList.add("sheet-open");
    });
  };
  const close = () => {
    sheet.classList.remove("is-open");
    document.body.classList.remove("sheet-open");
    setTimeout(() => {
      sheet.hidden = true;
    }, 420);
  };

  openBtn.addEventListener("click", open);
  sheet.querySelectorAll(".cv-opt").forEach((o) =>
    o.addEventListener("click", () => select(o.getAttribute("data-lang")))
  );
  sheet.querySelector("[data-close]").addEventListener("click", close);
  dl.addEventListener("click", () => setTimeout(close, 60)); // let the download start
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !sheet.hidden) close();
  });
}

/* ---------- live Uzbekistan clock ---------- */

function startClock() {
  const out = document.getElementById("clock-time");
  if (!out) return;
  const fmt = new Intl.DateTimeFormat(undefined, {
    timeZone: CONTENT.profile.timezone || "Asia/Tashkent",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const tick = () => {
    out.textContent = fmt.format(new Date());
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- per-page content hooks ---------- */

function renderContent() {
  const photo = document.querySelector("[data-content='photo']");
  if (photo) {
    photo.src = CONTENT.profile.photo;
    photo.alt = CONTENT.profile.name;
  }
  document.querySelectorAll("[data-content='name']").forEach((el) => {
    el.textContent = CONTENT.profile.name;
  });

  // social / links list (Contact page)
  const social = document.getElementById("social-links");
  if (social && Array.isArray(CONTENT.social)) {
    const arrow =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
    social.innerHTML = CONTENT.social
      .map((s) => {
        const external = /^https?:/i.test(s.url) ? ' target="_blank" rel="noopener"' : "";
        return `<a class="link-row" href="${s.url}"${external}>
            <span class="link-row__label">${s.label}</span>
            <span class="link-row__handle">${s.handle}</span>
            ${arrow}
          </a>`;
      })
      .join("");
  }
}

/* ---------- reveal-on-load ---------- */

function revealOnLoad() {
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
}

/* ---------- boot ---------- */

async function init() {
  try {
    await loadData();
  } catch (err) {
    console.error("Failed to load site data:", err);
  }

  currentLang = getStoredLang();
  document.documentElement.lang = currentLang;
  applyStoredCollapse();

  buildSidebar();
  buildTopbar();
  buildFooter();
  buildSheet();
  renderContent();

  wireDrawer();
  wireCollapse();
  wireTheme();
  wireLangSwitcher();
  wireSheet();
  startClock();
  applyTheme(getStoredTheme());

  applyTranslations();
  syncLangSwitcher();
  revealOnLoad();
}

document.addEventListener("DOMContentLoaded", init);
