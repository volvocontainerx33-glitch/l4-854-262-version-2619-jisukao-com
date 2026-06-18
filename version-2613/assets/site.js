(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMenu() {
        var button = qs('.menu-toggle');
        var panel = qs('.mobile-panel');
        if (!button || !panel) {
            return;
        }
        button.addEventListener('click', function () {
            var opened = panel.hasAttribute('hidden');
            if (opened) {
                panel.removeAttribute('hidden');
                button.setAttribute('aria-expanded', 'true');
                button.textContent = '×';
            } else {
                panel.setAttribute('hidden', '');
                button.setAttribute('aria-expanded', 'false');
                button.textContent = '☰';
            }
        });
    }

    function initHero() {
        var hero = qs('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = qsa('.hero-slide', hero);
        var dots = qsa('.hero-dot', hero);
        var prev = qs('.hero-prev', hero);
        var next = qs('.hero-next', hero);
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function restart() {
            window.clearInterval(timer);
            start();
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                restart();
            });
        }
        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                show(dotIndex);
                restart();
            });
        });
        if (slides.length > 1) {
            start();
        }
    }

    function filterCards(term) {
        var normalized = (term || '').trim().toLowerCase();
        var cards = qsa('.page-filter-grid [data-filter]');
        cards.forEach(function (card) {
            var text = (card.getAttribute('data-filter') || '').toLowerCase();
            card.classList.toggle('is-filtered', normalized && text.indexOf(normalized) === -1);
        });
    }

    function initFiltering() {
        var input = qs('.page-filter-input') || qs('#searchInput');
        var query = new URLSearchParams(window.location.search).get('q') || '';
        if (input) {
            input.value = query;
            filterCards(query);
            input.addEventListener('input', function () {
                filterCards(input.value);
            });
        }
        qsa('.filter-chip').forEach(function (button) {
            button.addEventListener('click', function () {
                var value = button.getAttribute('data-chip') || '';
                qsa('.filter-chip').forEach(function (item) {
                    item.classList.toggle('is-active', item === button);
                });
                if (input) {
                    input.value = value;
                }
                filterCards(value);
            });
        });
    }

    function initForms() {
        qsa('form[action="search.html"]').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                var input = qs('input[name="q"]', form);
                if (input && input.value.trim()) {
                    return;
                }
                if (form.classList.contains('page-filter-form')) {
                    event.preventDefault();
                    filterCards(input ? input.value : '');
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMenu();
        initHero();
        initFiltering();
        initForms();
    });
})();
