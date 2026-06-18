(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var menuButton = qs('[data-menu-button]');
  var mobileMenu = qs('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
  }

  qsa('[data-hero]').forEach(function (hero) {
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var next = qs('[data-hero-next]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    show(0);
    start();
  });

  qsa('[data-filter-scope]').forEach(function (scope) {
    var search = qs('[data-filter-search]', scope);
    var year = qs('[data-filter-year]', scope);
    var type = qs('[data-filter-type]', scope);
    var region = qs('[data-filter-region]', scope);
    var empty = qs('[data-empty-result]', scope);
    var container = scope.nextElementSibling;
    var cards = container ? qsa('[data-card]', container) : qsa('[data-card]');

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function apply() {
      var keyword = normalize(search && search.value);
      var y = normalize(year && year.value);
      var t = normalize(type && type.value);
      var r = normalize(region && region.value);
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-type'),
          card.getAttribute('data-tags')
        ].join(' '));
        var ok = true;

        if (keyword && haystack.indexOf(keyword) === -1) {
          ok = false;
        }
        if (y && normalize(card.getAttribute('data-year')) !== y) {
          ok = false;
        }
        if (t && normalize(card.getAttribute('data-type')).indexOf(t) === -1) {
          ok = false;
        }
        if (r && normalize(card.getAttribute('data-region')).indexOf(r) === -1) {
          ok = false;
        }

        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    [search, year, type, region].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
  });
})();
