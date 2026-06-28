/* =========================================================================
   Portfolio interactions — vanilla JS, no dependencies.
   ========================================================================= */
(function () {
  "use strict";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* --------------------- Header: scrolled state + progress -------------- */
  const header   = $(".site-header");
  const progress = $(".scroll-progress");
  const toTop    = $(".to-top");

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle("scrolled", y > 20);
    if (toTop)  toTop.classList.toggle("show", y > 480);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) toTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ----------------------------- Mobile nav ---------------------------- */
  const nav    = $(".nav");
  const toggle = $(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
      toggle.innerHTML = open ? "&#10005;" : "&#9776;";
    });
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.innerHTML = "&#9776;";
        toggle.setAttribute("aria-expanded", false);
      }
    });
  }

  /* --------------------- Active link on scroll (spy) ------------------- */
  const sections = $$("section[id]");
  const navLinks = $$('.nav a[href^="#"]');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const id = en.target.id;
        navLinks.forEach((a) =>
          a.classList.toggle("active", a.getAttribute("href") === "#" + id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* --------------------------- Scroll reveal --------------------------- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        revealer.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el) => revealer.observe(el));

  /* ------------------------- Gallery filtering ------------------------- */
  const filterBtns = $$(".filter-btn");
  const tiles      = $$(".masonry .tile");
  const moreWrap   = $(".gallery-more");
  const moreBtn    = moreWrap ? $("button", moreWrap) : null;

  const GALLERY_LIMIT = 15; // tiles shown before "Show all" (only for the "All" view)
  let currentFilter = "all";
  let expanded = false;

  function applyGallery() {
    let shown = 0;
    tiles.forEach((t) => {
      const match = currentFilter === "all" || t.dataset.cat === currentFilter;
      let show = match;
      // Collapse only applies to the unfiltered "All" view
      if (match && currentFilter === "all" && !expanded) {
        shown++;
        if (shown > GALLERY_LIMIT) show = false;
      }
      t.classList.toggle("is-hidden", !show);
    });
    updateMoreBtn();
  }

  function updateMoreBtn() {
    if (!moreWrap) return;
    const total = tiles.length;
    if (currentFilter === "all" && total > GALLERY_LIMIT) {
      moreWrap.style.display = "";
      moreBtn.innerHTML = expanded
        ? '<i class="fa-solid fa-chevron-up"></i> Show less'
        : '<i class="fa-solid fa-chevron-down"></i> Show all ' + total + " images";
    } else {
      moreWrap.style.display = "none";
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      expanded = false; // reset collapse when switching filters
      applyGallery();
    });
  });

  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      expanded = !expanded;
      applyGallery();
      if (!expanded) {
        // scroll back up to the gallery so the user isn't left in mid-page
        const g = document.getElementById("gallery");
        if (g) window.scrollTo({ top: g.offsetTop - 60, behavior: "smooth" });
      }
    });
  }

  applyGallery(); // initial collapsed state

  /* ------------------------------ Lightbox ----------------------------- */
  // Any element with [data-gallery] holds a JSON array of image srcs in
  // data-gallery, OR we collect from child <img> elements. Clicking opens
  // a navigable lightbox.
  const lb        = $(".lightbox");
  const lbImg     = $(".lightbox img");
  const lbCounter = $(".lb-counter");
  let group = [];
  let idx   = 0;

  function openLB(images, start) {
    group = images;
    idx = start || 0;
    render();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLB() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  function render() {
    if (!group.length) return;
    lbImg.src = group[idx];
    lbCounter.textContent = (idx + 1) + " / " + group.length;
  }
  function step(n) {
    idx = (idx + n + group.length) % group.length;
    render();
  }

  // Project galleries: element carries data-gallery='["a.png","b.png"]'
  $$("[data-gallery]").forEach((el) => {
    el.addEventListener("click", () => {
      let imgs = [];
      try { imgs = JSON.parse(el.getAttribute("data-gallery")); } catch (e) {}
      if (imgs.length) openLB(imgs, 0);
    });
  });

  // Standalone gallery tiles: open the full visible set, starting at clicked.
  tiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      const visible = tiles.filter((t) => !t.classList.contains("is-hidden"));
      const imgs = visible.map((t) => t.querySelector("img").src);
      const start = visible.indexOf(tile);
      openLB(imgs, Math.max(0, start));
    });
  });

  if (lb) {
    $(".lb-close").addEventListener("click", closeLB);
    $(".lb-next").addEventListener("click", () => step(1));
    $(".lb-prev").addEventListener("click", () => step(-1));
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape")     closeLB();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft")  step(-1);
    });
  }

  /* --------------------- Animated stat counters ------------------------ */
  const counters = $$("[data-count]");
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      let cur = 0;
      const steps = 40;
      const inc = target / steps;
      const tick = () => {
        cur += inc;
        if (cur >= target) { el.textContent = target + suffix; }
        else { el.textContent = Math.floor(cur) + suffix; requestAnimationFrame(tick); }
      };
      tick();
      countObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => countObs.observe(c));

  /* --------------------------- Footer year ----------------------------- */
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
