/* Atlas After Blue — home page interactions */
(function () {
  'use strict';

  var menuButton = document.getElementById('menu-toggle');
  var nav = document.getElementById('site-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.focus();
      }
    });
  }

  // Backward-compatible navigation for the existing Report/Method/Sources/About pages.
  var legacyBurger = document.getElementById('burger');
  var legacyNav = document.getElementById('nav');
  if (legacyBurger && legacyNav) {
    function setLegacyOpen(open) {
      legacyNav.classList.toggle('open', open);
      legacyBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    legacyBurger.addEventListener('click', function () {
      setLegacyOpen(!legacyNav.classList.contains('open'));
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && legacyNav.classList.contains('open')) {
        setLegacyOpen(false);
        legacyBurger.focus();
      }
    });
    legacyNav.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) setLegacyOpen(false);
    });
  }

  // Interactive before/after radar comparison.
  var range = document.getElementById('compare-range');
  var afterClip = document.getElementById('radar-after-clip');
  var divider = document.getElementById('compare-divider');
  var compareStage = document.getElementById('compare-stage');
  var singleLayer = document.getElementById('single-layer');
  var caption = document.getElementById('viewer-caption');
  var tabs = document.querySelectorAll('[data-layer]');

  function setCompare(value) {
    if (!afterClip || !divider) return;
    afterClip.style.clipPath = 'inset(0 0 0 ' + value + '%)';
    divider.style.left = value + '%';
  }
  if (range) {
    range.addEventListener('input', function () { setCompare(range.value); });
    setCompare(range.value);
  }

  var layerInfo = {
    compare: { caption: 'Drag the divider to compare the 14 July and 26 July scenes.' },
    change: { src: 'img/change.png', alt: 'NISAR radar backscatter change image comparing 14 and 26 July 2026', caption: 'Backscatter change layer · 14 to 26 July 2026.' },
    before: { src: 'img/pre.png', alt: 'NISAR L-band radar scene from 14 July 2026, before the flash flood', caption: '14 July 2026 · Before-event NISAR scene.' },
    after: { src: 'img/post.png', alt: 'NISAR L-band radar scene from 26 July 2026, after the flash flood', caption: '26 July 2026 · Post-event NISAR scene.' }
  };

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var layer = tab.getAttribute('data-layer');
      tabs.forEach(function (item) {
        var active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      if (layer === 'compare') {
        compareStage.hidden = false;
        singleLayer.hidden = true;
        caption.textContent = layerInfo.compare.caption;
      } else {
        compareStage.hidden = true;
        singleLayer.hidden = false;
        singleLayer.src = layerInfo[layer].src;
        singleLayer.alt = layerInfo[layer].alt;
        caption.textContent = layerInfo[layer].caption;
      }
    });
  });

  // Load the approved summary data when present. Static, source-grounded
  // fallback figures remain visible if the JSON file is unavailable.
  var metricsBox = document.getElementById('metrics');
  var finding = document.getElementById('hero-finding');
  function makeMetric(label, value, unit, note, linkText, href, kind, isBadge) {
    var article = document.createElement('article');
    article.className = 'metric-card ' + kind;
    var title = document.createElement('p');
    title.className = 'metric-label';
    title.textContent = label;
    article.appendChild(title);
    if (isBadge) {
      var status = document.createElement('p');
      status.className = 'metric-status';
      var badge = document.createElement('span');
      badge.className = 'pass-badge';
      badge.textContent = value;
      status.appendChild(badge);
      article.appendChild(status);
    } else {
      var number = document.createElement('p');
      number.className = 'metric-value';
      number.appendChild(document.createTextNode(value + ' '));
      var unitNode = document.createElement('span');
      unitNode.textContent = unit;
      number.appendChild(unitNode);
      article.appendChild(number);
    }
    var noteNode = document.createElement('p');
    noteNode.className = 'metric-note';
    noteNode.textContent = note;
    article.appendChild(noteNode);
    var link = document.createElement('a');
    link.className = 'metric-link';
    link.href = href;
    link.appendChild(document.createTextNode(linkText));
    var arrow = document.createElement('span');
    arrow.textContent = '↗';
    link.appendChild(arrow);
    article.appendChild(link);
    return article;
  }

  function renderMetrics(data) {
    if (!metricsBox) return;
    var pairValid = data.pair_valid === true;
    metricsBox.textContent = '';
    metricsBox.appendChild(makeMetric(
      'Candidate flood area',
      Number(data.flooded_area_sqkm).toFixed(4), 'km²',
      (data.confidence || 'Low') + ' confidence · unvalidated',
      'How this was measured', 'report.html#map', 'metric-blue'
    ));
    metricsBox.appendChild(makeMetric(
      'Uncertain surface change',
      Number(data.uncertain_area_sqkm).toFixed(2), 'km²',
      'Radar got brighter; not counted as flood',
      'Why it is uncertain', 'method.html#thresholds', 'metric-amber'
    ));
    metricsBox.appendChild(makeMetric(
      'From flood peak to post-event scene', '4', 'days',
      '22 July event, 26 July scene',
      'The observation gap', 'report.html#limitations', 'metric-navy'
    ));
    metricsBox.appendChild(makeMetric(
      'Scene pair valid', pairValid ? 'PASS' : 'FAIL', '',
      'Same track, frame and direction',
      'Pair check', 'method.html#pair', 'metric-navy', true
    ));
    if (data.headline && finding) finding.textContent = data.headline;
  }

  fetch('data/summary.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Summary data unavailable');
      return response.json();
    })
    .then(renderMetrics)
    .catch(function () {
      // Keep the verified homepage fallback values already in the HTML.
    });

  var acknowledgement = document.getElementById('ack');
  if (acknowledgement) {
    fetch('data/sources.json')
      .then(function (response) {
        if (!response.ok) throw new Error('Sources data unavailable');
        return response.json();
      })
      .then(function (data) {
        if (data && data.acknowledgement) acknowledgement.textContent = data.acknowledgement;
      })
      .catch(function () {
        // Keep the concise fallback acknowledgement.
      });
  }
})();
