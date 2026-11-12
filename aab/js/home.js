/* Atlas After Blue — home page interactions.
   Loaded after common.js. Does NOT touch the menu toggle or the image
   viewer logic, which stay in common.js. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var hero = document.getElementById('hero');
  var header = document.getElementById('site-header');

  /* 1. Header: transparent over hero, solid after scrolling */
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) {
      header.classList.toggle('is-over-hero', y < 24);
      header.classList.toggle('is-scrolled', y >= 24);
    }
    if (hero && !reduce && y < window.innerHeight) {
      hero.style.setProperty('--sy', (y * 0.12).toFixed(1));
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 2. Hero: mouse parallax + cursor glow */
  if (hero && !reduce && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--mx', (x * 2 - 1).toFixed(3));
      hero.style.setProperty('--my', (y * 2 - 1).toFixed(3));
      hero.style.setProperty('--px', (x * 100).toFixed(1) + '%');
      hero.style.setProperty('--py', (y * 100).toFixed(1) + '%');
    });
    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--mx', 0);
      hero.style.setProperty('--my', 0);
    });
  }

  /* 3. Scroll reveal */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* 4. Count-up for key figures (final value is already in the HTML) */
  var counts = document.querySelectorAll('.count[data-to]');
  function runCount(el) {
    var to = parseFloat(el.dataset.to);
    var dec = parseInt(el.dataset.dec || '0', 10);
    var dur = 1300, t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = to.toFixed(dec);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  /* 5. Metric cards: glow follows the cursor */
  document.querySelectorAll('.metric-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--cx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--cy', (e.clientY - r.top) + 'px');
    });
  });

  /* 6. Image explorer: one gentle sweep to show the divider is draggable.
        Stops immediately if the visitor touches it. */
  var range = document.getElementById('compare-range');
  var viewer = document.getElementById('radar-viewer');
  if (range && viewer && 'IntersectionObserver' in window && !reduce) {
    var cancelled = false, played = false;
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      viewer.addEventListener(ev, function () { cancelled = true; }, { passive: true });
    });
    var vio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || played) return;
      played = true; vio.disconnect();
      var t0 = null, dur = 2200;
      function frame(t) {
        if (cancelled) return;
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        range.value = String(Math.round(50 + Math.sin(p * Math.PI * 2) * 22));
        range.dispatchEvent(new Event('input', { bubbles: true }));
        if (p < 1) requestAnimationFrame(frame);
        else { range.value = '50'; range.dispatchEvent(new Event('input', { bubbles: true })); }
      }
      setTimeout(function () { requestAnimationFrame(frame); }, 400);
    }, { threshold: 0.5 });
    vio.observe(viewer);
  }
})();
