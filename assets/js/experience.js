/* =========================================================================
   experience.js — Job Experience page renderer
   Reads data/experience/index.json (the ordered list of job files), then
   each job's JSON, and renders them as segmented cards. Content editors
   only ever touch the JSON files in data/experience/ — never this code.
   ========================================================================= */

(() => {
  const LIST_URL = "data/experience/index.json";
  const BASE = "data/experience/";
  const FALLBACK_LANG = "en";

  let jobs = []; // loaded job objects, in display order

  // localStorage first: documentElement.lang is set async by main.js on boot
  const langNow = () =>
    localStorage.getItem("site.lang") ||
    document.documentElement.lang ||
    FALLBACK_LANG;

  // Small helper to escape user-editable JSON strings for safe HTML output.
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  // i18n labels are handled by main.js via data-i18n; these are the page's own.
  const LABELS = {
    en: { results: "Key results", current: "Current" },
    ru: { results: "Ключевые результаты", current: "Сейчас" },
    uz: { results: "Asosiy natijalar", current: "Hozirda" },
  };

  async function loadJobs() {
    const index = await fetch(LIST_URL).then((r) => r.json());
    jobs = await Promise.all(
      index.jobs.map((f) => fetch(BASE + f).then((r) => r.json()))
    );
  }

  function render() {
    const root = document.getElementById("xp-list");
    if (!root) return;

    const lang = langNow();
    const labels = LABELS[lang] || LABELS[FALLBACK_LANG];

    root.innerHTML = jobs
      .map((job, i) => {
        const d = job[lang] || job[FALLBACK_LANG];

        const badge = job.current
          ? `<span class="xp-badge">${esc(labels.current)}</span>`
          : "";

        const highlights = d.highlights?.length
          ? `<ul class="xp-highlights">${d.highlights
              .map((h) => `<li>${esc(h)}</li>`)
              .join("")}</ul>`
          : "";

        const results = d.results?.length
          ? `<div class="xp-results">
               <p class="xp-results__label">${esc(labels.results)}</p>
               <ul class="xp-results__list">${d.results
                 .map((r) => `<li>${esc(r)}</li>`)
                 .join("")}</ul>
             </div>`
          : "";

        return `
          <article class="xp-card" data-reveal data-reveal-delay="${Math.min(i, 3)}">
            <header class="xp-card__head">
              <div class="xp-card__title">
                <h2 class="xp-role">${esc(d.role)}</h2>
                <p class="xp-company">${esc(d.company)}</p>
              </div>
              ${badge}
            </header>
            <div class="xp-meta">
              <span class="xp-chip">${esc(d.period)}</span>
              <span class="xp-chip">${esc(d.duration)}</span>
              <span class="xp-chip">${esc(d.type)}</span>
            </div>
            <p class="xp-summary">${esc(d.summary)}</p>
            ${highlights}
            ${results}
          </article>`;
      })
      .join("");

    // make freshly injected cards visible (page may already be .is-ready)
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  }

  async function init() {
    try {
      await loadJobs();
      render();
    } catch (err) {
      console.error("Failed to load experience data:", err);
    }
    // re-render in the new language when the switcher is used
    document.addEventListener("langchange", render);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
