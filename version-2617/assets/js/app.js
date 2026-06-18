(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var navToggle = $('[data-nav-toggle]');
  var mainNav = $('[data-main-nav]');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      mainNav.classList.toggle('is-open');
    });
  }

  var hero = $('[data-hero]');
  if (hero) {
    var slides = $all('[data-hero-slide]', hero);
    var dots = $all('[data-hero-dot]', hero);
    var prev = $('[data-hero-prev]', hero);
    var next = $('[data-hero-next]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function applyFilters(panel) {
    var keyword = $('[data-filter-keyword]', panel);
    var category = $('[data-filter-category]', panel);
    var year = $('[data-filter-year]', panel);
    var list = $('[data-filter-list]');
    if (!list) {
      return;
    }
    var cards = $all('.movie-card', list);
    var key = (keyword && keyword.value || '').trim().toLowerCase();
    var cat = category && category.value || '';
    var y = (year && year.value || '').trim();

    cards.forEach(function (card) {
      var hay = [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-year'),
        card.getAttribute('data-tags')
      ].join(' ').toLowerCase();
      var sameKeyword = !key || hay.indexOf(key) !== -1;
      var sameCategory = !cat || card.getAttribute('data-category') === cat;
      var sameYear = !y || (card.getAttribute('data-year') || '').indexOf(y) !== -1;
      card.classList.toggle('is-filter-hidden', !(sameKeyword && sameCategory && sameYear));
    });
  }

  var filterPanel = $('[data-filter-panel]');
  if (filterPanel) {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    var keywordInput = $('[data-filter-keyword]', filterPanel);
    if (q && keywordInput) {
      keywordInput.value = q;
    }
    $all('input, select', filterPanel).forEach(function (control) {
      control.addEventListener('input', function () {
        applyFilters(filterPanel);
      });
      control.addEventListener('change', function () {
        applyFilters(filterPanel);
      });
    });
    applyFilters(filterPanel);
  }
})();

function playCurrentVideo(videoId, m3u8Url, coverId) {
  var video = document.getElementById(videoId);
  var cover = document.getElementById(coverId);
  if (!video) {
    return;
  }
  if (cover) {
    cover.classList.add('is-hidden');
  }
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    if (video.src !== m3u8Url) {
      video.src = m3u8Url;
    }
    video.play();
    return;
  }
  if (window.Hls && window.Hls.isSupported()) {
    if (!video._hlsReady) {
      var hls = new window.Hls();
      hls.loadSource(m3u8Url);
      hls.attachMedia(video);
      video._hlsReady = true;
      video._hlsInstance = hls;
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        video.play();
      });
    } else {
      video.play();
    }
    return;
  }
  video.src = m3u8Url;
  video.play();
}
