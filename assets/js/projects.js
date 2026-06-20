/* =========================================================================
   projects.js — Projects page
   Data-driven from projects/: banner.json, badges.json, registry.json, and
   one projects/<id>/project.json per project. Renders the banner, the
   auto-scrolling tool-badge marquee, and the project grid. Clicking a card
   opens an (empty for now) bottom sheet.

   To add a project: create projects/<id>/ with project.json + a thumbnail,
   then add its id to projects/registry.json. No code changes needed.
   ========================================================================= */

(() => {
  const ROOT = "projects/";
  const FALLBACK_LANG = "en";

  // Labels owned by this page (kept in sync with the site's 3 languages).
  const LABELS = {
    en: {
      soon: "Coming soon",
      close: "Close",
      views: "views",
      notice:
        "Heads up — the portfolio files are temporarily unavailable while I rebuild the Projects section. It'll be updated soon. Thanks for your patience!",
    },
    ru: {
      soon: "Скоро",
      close: "Закрыть",
      views: "просмотры",
      notice:
        "Обратите внимание — файлы портфолио временно недоступны, пока я обновляю раздел «Проекты». Скоро всё заработает. Спасибо за терпение!",
    },
    uz: {
      soon: "Tez kunda",
      close: "Yopish",
      views: "ko‘rishlar",
      notice:
        "Eslatma — men «Loyihalar» bo‘limini yangilayotganim sababli portfolio fayllari vaqtincha mavjud emas. Tez orada yangilanadi. Sabringiz uchun rahmat!",
    },
  };

  const ICON_INFO =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6h.01"/></svg>';
  const ICON_EYE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  const ICON_CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  let banner = null;
  let badges = [];
  let projects = []; // { id, base, data }

  const langNow = () =>
    localStorage.getItem("site.lang") ||
    document.documentElement.lang ||
    FALLBACK_LANG;
  const labelsNow = () => LABELS[langNow()] || LABELS[FALLBACK_LANG];

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  // Pick a localized value: accepts a plain string or {en,ru,uz}.
  const pick = (field) => {
    if (field == null) return "";
    if (typeof field === "string") return field;
    return field[langNow()] || field[FALLBACK_LANG] || "";
  };

  const fmtViews = (n) =>
    n >= 1000 ? (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0) + "k" : String(n);

  /* ---------- data ---------- */

  async function loadData() {
    const [b, bd, reg] = await Promise.all([
      fetch(ROOT + "banner.json").then((r) => r.json()).catch(() => null),
      fetch(ROOT + "badges.json").then((r) => r.json()).catch(() => ({ badges: [] })),
      fetch(ROOT + "registry.json").then((r) => r.json()),
    ]);
    banner = b;
    badges = bd.badges || [];
    projects = await Promise.all(
      (reg.projects || []).map(async (id) => {
        const base = `${ROOT}${id}/`;
        const data = await fetch(base + "project.json").then((r) => r.json());
        return { id, base, data };
      })
    );
  }

  /* ---------- notice ---------- */

  function renderNotice() {
    const el = document.getElementById("projects-notice");
    if (!el) return;
    el.innerHTML = `${ICON_INFO}<span>${esc(labelsNow().notice)}</span>`;
  }

  /* ---------- banner ---------- */

  function renderBanner() {
    const el = document.getElementById("projects-banner");
    if (!el || !banner) return;

    const heading = esc(pick(banner.heading));
    const sub = esc(pick(banner.subheading));
    const contact = banner.contact ? esc(banner.contact) : "";
    const cta =
      banner.cta && banner.cta.href
        ? `<a class="btn btn--secondary pbanner__cta" href="${esc(banner.cta.href)}">${esc(
            pick(banner.cta.label)
          )}</a>`
        : "";

    el.style.backgroundImage = banner.image ? `url("${banner.image}")` : "";
    el.classList.toggle("pbanner--image", !!banner.image);

    el.innerHTML = `
      <div class="pbanner__inner">
        ${heading ? `<h1 class="pbanner__heading">${heading}</h1>` : ""}
        ${sub ? `<p class="pbanner__sub">${sub}</p>` : ""}
        <div class="pbanner__meta">
          ${contact ? `<a class="pbanner__contact" href="mailto:${contact}">${contact}</a>` : ""}
          ${cta}
        </div>
      </div>`;
  }

  /* ---------- tool-badge marquee ---------- */

  function badgeHTML(b) {
    const icon = b.icon
      ? `<span class="badge__icon"><img src="${esc(b.icon)}" alt="" loading="lazy" /></span>`
      : "";
    return `<span class="badge">${icon}<span>${esc(b.label)}</span></span>`;
  }

  function renderBadges() {
    const track = document.getElementById("badges-track");
    if (!track) return;
    if (!badges.length) {
      track.closest(".marquee")?.style.setProperty("display", "none");
      return;
    }
    const group = badges.map(badgeHTML).join("");
    // duplicated group => seamless -50% loop
    track.innerHTML =
      `<div class="marquee__group">${group}</div>` +
      `<div class="marquee__group" aria-hidden="true">${group}</div>`;
  }

  /* ---------- grid ---------- */

  function renderGrid() {
    const grid = document.getElementById("projects-grid");
    if (!grid) return;
    const l = labelsNow();

    grid.innerHTML = projects
      .map(({ id, base, data }) => {
        const thumb = data.thumbnail ? base + data.thumbnail : "";
        const views = Number(data.views) || 0;
        return `
          <button class="pcard" type="button" data-id="${esc(id)}" aria-label="${esc(
          data.title || id
        )}">
            <img class="pcard__thumb" src="${esc(thumb)}" alt="" loading="lazy" />
            <span class="pcard__title">${esc(data.title || "")}</span>
            <span class="pcard__views" title="${fmtViews(views)} ${esc(l.views)}">
              ${ICON_EYE}<span>${fmtViews(views)}</span>
            </span>
          </button>`;
      })
      .join("");
  }

  /* ---------- bottom sheet (empty skeleton) ---------- */

  function buildSheet() {
    if (document.getElementById("project-sheet")) return;
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.id = "project-sheet";
    sheet.hidden = true;
    sheet.innerHTML = `
      <div class="sheet__scrim" data-close></div>
      <div class="sheet__panel sheet__panel--project" role="dialog" aria-modal="true"
           aria-labelledby="project-sheet-title">
        <div class="sheet__head">
          <h2 class="sheet__heading" id="project-sheet-title"></h2>
          <button class="sheet__close" type="button" data-close></button>
        </div>
        <div class="sheet__body">
          <p class="sheet__soon"></p>
        </div>
      </div>`;
    document.body.appendChild(sheet);
  }

  function wireSheet() {
    const grid = document.getElementById("projects-grid");
    const sheet = document.getElementById("project-sheet");
    if (!grid || !sheet) return;

    const heading = sheet.querySelector(".sheet__heading");
    const soon = sheet.querySelector(".sheet__soon");
    const closeBtn = sheet.querySelector(".sheet__close");

    const open = (proj) => {
      const l = labelsNow();
      heading.textContent = proj.data.title || "";
      soon.textContent = l.soon;
      closeBtn.setAttribute("aria-label", l.close);
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

    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".pcard");
      if (!card) return;
      const proj = projects.find((p) => p.id === card.getAttribute("data-id"));
      if (proj) open(proj);
    });
    sheet.querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", close)
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !sheet.hidden) close();
    });
  }

  /* ---------- boot ---------- */

  function renderAll() {
    renderNotice();
    renderBanner();
    renderGrid();
  }

  async function init() {
    try {
      await loadData();
      renderNotice();
      renderBanner();
      renderBadges();
      renderGrid();
      buildSheet();
      wireSheet();
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
    // banner text + view labels follow the language switcher
    document.addEventListener("langchange", renderAll);
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
