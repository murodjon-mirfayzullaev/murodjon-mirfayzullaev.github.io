/* =========================================================================
   experience.js — Job Experience page renderer
   Reads data/experience/index.json (the ordered list of job files), then
   each job's JSON, and renders them as a timeline of cards with an
   expandable description. Content editors only ever touch the JSON files in
   data/experience/ — never this code.
   ========================================================================= */

(() => {
  const LIST_URL = "data/experience/index.json";
  const BASE = "data/experience/";
  const FALLBACK_LANG = "en";

  // UI labels rendered by this script (job content itself lives in JSON).
  const LABELS = {
    en: {
      results: "Key results",
      show: "Show description",
      hide: "Hide description",
      updated: "Last updated",
      updatedHint:
        "This section shows the latest available information; it may be updated over time.",
    },
    ru: {
      results: "Ключевые результаты",
      show: "Показать описание",
      hide: "Скрыть описание",
      updated: "Последнее обновление",
      updatedHint:
        "Здесь показана последняя доступная информация; раздел может обновляться.",
    },
    uz: {
      results: "Asosiy natijalar",
      show: "Tavsifni ko‘rsatish",
      hide: "Tavsifni yashirish",
      updated: "Oxirgi yangilanish",
      updatedHint:
        "Bu bo‘limda eng so‘nggi ma’lumotlar ko‘rsatilgan; vaqti-vaqti bilan yangilanishi mumkin.",
    },
  };

  const ICON_INFO =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6h.01"/></svg>';

  // Month names per language (Intl's long month support for uz is unreliable).
  const MONTHS = {
    en: ["January", "February", "March", "April", "May", "June", "July",
         "August", "September", "October", "November", "December"],
    ru: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль",
         "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
    uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul",
         "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  };

  function formatMonthYear(iso, lang) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso; // not a date → show as written
    const month = (MONTHS[lang] || MONTHS.en)[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return lang === "uz" ? `${year}-yil ${month}` : `${month} ${year}`;
  }

  let jobs = []; // loaded job objects, in display order
  let updatedAt = null; // ISO-ish date string from index.json

  // localStorage first: documentElement.lang is set async by main.js on boot
  const langNow = () =>
    localStorage.getItem("site.lang") ||
    document.documentElement.lang ||
    FALLBACK_LANG;

  const labelsNow = () => LABELS[langNow()] || LABELS[FALLBACK_LANG];

  // Escape user-editable JSON strings for safe HTML output.
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  async function loadJobs() {
    const index = await fetch(LIST_URL).then((r) => r.json());
    updatedAt = index.lastUpdated || null;
    jobs = await Promise.all(
      index.jobs.map((f) => fetch(BASE + f).then((r) => r.json()))
    );
  }

  function renderUpdated() {
    const el = document.getElementById("xp-updated");
    if (!el) return;
    if (!updatedAt) {
      el.innerHTML = "";
      return;
    }
    const lang = langNow();
    const labels = labelsNow();
    const dateStr = formatMonthYear(updatedAt, lang);
    el.setAttribute("title", labels.updatedHint);
    el.innerHTML = `${ICON_INFO}<span>${esc(labels.updated)}: <time datetime="${esc(
      updatedAt
    )}">${esc(dateStr)}</time></span>`;
  }

  function render() {
    renderUpdated();

    const root = document.getElementById("xp-list");
    if (!root) return;

    const lang = langNow();
    const labels = labelsNow();

    root.innerHTML = jobs
      .map((job, i) => {
        const d = job[lang] || job[FALLBACK_LANG];

        const metaChips = [d.duration, d.type]
          .filter(Boolean)
          .map((x) => `<span class="xp-chip">${esc(x)}</span>`)
          .join("");
        const metaRow = metaChips ? `<div class="xp-meta">${metaChips}</div>` : "";

        const summary = d.summary ? `<p class="xp-summary">${esc(d.summary)}</p>` : "";

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

        const hasDesc = summary || highlights || results;
        const description = hasDesc
          ? `<button class="xp-toggle" type="button" aria-expanded="false">${esc(
              labels.show
            )}</button>
             <div class="xp-desc">
               <div class="xp-desc__inner">${metaRow}${summary}${highlights}${results}</div>
             </div>`
          : "";

        return `
          <article class="xp-item${job.current ? " xp-item--current" : ""}"
                   data-reveal data-reveal-delay="${Math.min(i, 3)}">
            <span class="xp-dot" aria-hidden="true"></span>
            <div class="xp-card${hasDesc ? " xp-card--expandable" : ""}">
              <h2 class="xp-role">${esc(d.role)}</h2>
              <p class="xp-company">${esc(d.company)}</p>
              <p class="xp-period">${esc(d.period)}</p>
              ${description}
            </div>
          </article>`;
      })
      .join("");

    // make freshly injected cards visible (page may already be .is-ready)
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  }

  function toggleCard(card) {
    const open = card.classList.toggle("is-open");
    const btn = card.querySelector(".xp-toggle");
    if (btn) {
      btn.setAttribute("aria-expanded", String(open));
      const labels = labelsNow();
      btn.textContent = open ? labels.hide : labels.show;
    }
  }

  // One delegated handler survives re-renders (only innerHTML is replaced).
  // The whole card toggles; the real <button> keeps keyboard support (its
  // Enter/Space fires a click that bubbles here). Clicks inside the open
  // description are ignored so its text stays readable/selectable.
  function wireToggles() {
    const root = document.getElementById("xp-list");
    if (!root) return;
    root.addEventListener("click", (e) => {
      const card = e.target.closest(".xp-card--expandable");
      if (!card) return;
      if (e.target.closest(".xp-desc")) return;
      toggleCard(card);
    });
  }

  async function init() {
    try {
      await loadJobs();
      render();
    } catch (err) {
      console.error("Failed to load experience data:", err);
    }
    wireToggles();
    // re-render in the new language when the switcher is used
    document.addEventListener("langchange", render);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
