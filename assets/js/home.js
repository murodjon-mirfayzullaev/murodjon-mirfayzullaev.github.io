/* =========================================================================
   home.js — Home page widgets
   Renders the "Job Experience" widget (a preview of the active jobs from
   data/experience/) and the "Languages" widget (from content.json). Add
   future widgets here following the same pattern.
   ========================================================================= */

(() => {
  const LIST_URL = "data/experience/index.json";
  const BASE = "data/experience/";
  const FALLBACK_LANG = "en";

  const SHOW_COUNT = 3; // how many jobs to preview on the home page

  // "+N more" label per language
  const MORE = { en: "more", ru: "ещё", uz: "yana" };
  // "Active" badge (shown on jobs the user currently holds)
  const ACTIVE = { en: "Active", ru: "Активно", uz: "Faol" };

  // Localized language names + proficiency levels (data lives in content.json).
  const LANG_NAMES = {
    uz: { en: "Uzbek", ru: "Узбекский", uz: "O‘zbek tili" },
    ru: { en: "Russian", ru: "Русский", uz: "Rus tili" },
    en: { en: "English", ru: "Английский", uz: "Ingliz tili" },
    ar: { en: "Arabic", ru: "Арабский", uz: "Arab tili" },
    ko: { en: "Korean", ru: "Корейский", uz: "Koreys tili" },
    tr: { en: "Turkish", ru: "Турецкий", uz: "Turk tili" },
  };
  const LEVELS = {
    native: { en: "Native", ru: "Родной", uz: "Ona tili" },
    beginner: { en: "Beginner", ru: "Начальный", uz: "Boshlang‘ich" },
    elementary: { en: "Elementary", ru: "Элементарный", uz: "Elementar" },
    intermediate: { en: "Intermediate", ru: "Средний", uz: "O‘rta" },
    "upper-intermediate": {
      en: "Upper-Intermediate",
      ru: "Выше среднего",
      uz: "O‘rtadan yuqori",
    },
    advanced: { en: "Advanced", ru: "Продвинутый", uz: "Yuqori" },
    proficient: { en: "Proficient", ru: "В совершенстве", uz: "Mukammal" },
  };

  // Native badge text per language (CEFR has no code above C2).
  const NATIVE = { en: "Native", ru: "Родной", uz: "Ona tili" };

  let jobs = [];
  let content = null;

  const langNow = () =>
    localStorage.getItem("site.lang") ||
    document.documentElement.lang ||
    FALLBACK_LANG;

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  function renderExperience() {
    const root = document.getElementById("home-experience");
    if (!root) return;
    const lang = langNow();
    const shown = jobs.slice(0, SHOW_COUNT);
    const remaining = jobs.length - shown.length;
    const activeLabel = ACTIVE[lang] || ACTIVE[FALLBACK_LANG];

    root.innerHTML = shown
      .map((job) => {
        const d = job[lang] || job[FALLBACK_LANG];
        const badge = job.current
          ? `<span class="home-xp__badge">${esc(activeLabel)}</span>`
          : "";
        return `
          <div class="home-xp__item">
            <div class="home-xp__main">
              <span class="home-xp__role">${esc(d.role)}</span>
              <span class="home-xp__meta">${esc(d.company)} · ${esc(d.period)}</span>
            </div>
            ${badge}
          </div>`;
      })
      .join("");

    const moreEl = document.getElementById("home-xp-more");
    if (moreEl) {
      const more = MORE[lang] || MORE[FALLBACK_LANG];
      moreEl.textContent = remaining > 0 ? `+${remaining} ${more}` : "";
    }
  }

  function renderLanguages() {
    const root = document.getElementById("home-languages");
    if (!root || !content || !Array.isArray(content.languages)) return;
    const lang = langNow();

    root.innerHTML = content.languages
      .map((L) => {
        const name =
          (LANG_NAMES[L.id] && (LANG_NAMES[L.id][lang] || LANG_NAMES[L.id].en)) || L.id;
        const level =
          (LEVELS[L.level] && (LEVELS[L.level][lang] || LEVELS[L.level].en)) || L.level;
        const isNative = !L.cefr || L.cefr === "native";
        const badge = isNative ? NATIVE[lang] || NATIVE.en : L.cefr;
        return `
          <div class="lang-card">
            <img class="lang-card__flag" src="assets/img/flags/${esc(L.id)}.png" alt="" loading="lazy" />
            <div class="lang-card__body">
              <span class="lang-card__name">${esc(name)}</span>
              <span class="lang-card__level">${esc(level)}</span>
            </div>
            <span class="lang-card__badge">${esc(badge)}</span>
          </div>`;
      })
      .join("");
  }

  function renderAll() {
    renderExperience();
    renderLanguages();
  }

  async function init() {
    try {
      const [index, c] = await Promise.all([
        fetch(LIST_URL).then((r) => r.json()),
        fetch("data/content.json").then((r) => r.json()),
      ]);
      content = c;
      jobs = await Promise.all(
        index.jobs.map((f) => fetch(BASE + f).then((r) => r.json()))
      );
      renderAll();
    } catch (err) {
      console.error("Failed to load home widgets:", err);
    }
    document.addEventListener("langchange", renderAll);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
