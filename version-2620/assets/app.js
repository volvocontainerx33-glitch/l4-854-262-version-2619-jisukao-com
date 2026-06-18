(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var menu = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (menu && panel) {
      menu.addEventListener('click', function () {
        panel.classList.toggle('open');
        document.body.classList.toggle('menu-open', panel.classList.contains('open'));
      });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
      var prev = hero.querySelector('.hero-control.prev');
      var next = hero.querySelector('.hero-control.next');
      var current = 0;
      function show(index) {
        if (!slides.length) return;
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('active', i === current);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('active', i === current);
        });
      }
      if (prev) prev.addEventListener('click', function () { show(current - 1); });
      if (next) next.addEventListener('click', function () { show(current + 1); });
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () { show(i); });
      });
      setInterval(function () { show(current + 1); }, 5000);
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    var globalSearch = document.getElementById('globalSearch');
    var categorySearch = document.getElementById('categorySearch');
    if (globalSearch && query) globalSearch.value = query;

    var searchInput = globalSearch || categorySearch;
    var chips = Array.prototype.slice.call(document.querySelectorAll('.filter-chip'));
    var activeFilter = 'all';

    function normalize(text) {
      return (text || '').toString().toLowerCase().trim();
    }

    function applyFilter() {
      var term = normalize(searchInput ? searchInput.value : '');
      var filter = normalize(activeFilter);
      var items = Array.prototype.slice.call(document.querySelectorAll('.movie-card, .ranking-item'));
      items.forEach(function (item) {
        var haystack = normalize([
          item.getAttribute('data-title'),
          item.getAttribute('data-tags'),
          item.getAttribute('data-region'),
          item.getAttribute('data-year'),
          item.getAttribute('data-type')
        ].join(' '));
        var byTerm = !term || haystack.indexOf(term) > -1;
        var byFilter = filter === 'all' || haystack.indexOf(filter) > -1;
        item.hidden = !(byTerm && byFilter);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', applyFilter);
      applyFilter();
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (btn) { btn.classList.remove('active'); });
        chip.classList.add('active');
        activeFilter = chip.getAttribute('data-filter') || 'all';
        applyFilter();
      });
    });
  });
})();
