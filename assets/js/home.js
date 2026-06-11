/* =========================================================================
   home.js — Home page widgets
   Currently renders the "Job Experience" widget: a preview of ONLY the
   active jobs (current: true) pulled from data/experience/. The full list
   lives on the Experience page. Add future widgets (projects, links, ...)
   here following the same pattern.
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

  let jobs = [];

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

  async function loadJobs() {
    const index = await fetch(LIST_URL).then((r) => r.json());
    jobs = await Promise.all(
      index.jobs.map((f) => fetch(BASE + f).then((r) => r.json()))
    );
  }

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

  async function init() {
    try {
      await loadJobs();
      renderExperience();
    } catch (err) {
      console.error("Failed to load experience for home:", err);
    }
    document.addEventListener("langchange", renderExperience);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
