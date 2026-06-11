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

  // "+N more" label per language
  const MORE = { en: "more", ru: "ещё", uz: "yana" };

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
    const active = jobs.filter((j) => j.current);
    const remaining = jobs.length - active.length;

    let html = active
      .map((job) => {
        const d = job[lang] || job[FALLBACK_LANG];
        return `
          <div class="home-xp__item">
            <span class="home-xp__role">${esc(d.role)}</span>
            <span class="home-xp__meta">${esc(d.company)} · ${esc(d.period)}</span>
          </div>`;
      })
      .join("");

    if (remaining > 0) {
      const more = MORE[lang] || MORE[FALLBACK_LANG];
      html += `<a class="home-xp__more" href="experience.html">+${remaining} ${esc(more)}</a>`;
    }

    root.innerHTML = html;
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
