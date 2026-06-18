(function () {
    var navToggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.site-nav');

    if (navToggle && nav) {
        navToggle.addEventListener('click', function () {
            var isOpen = nav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    var hero = document.querySelector('[data-hero-carousel]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
        var current = 0;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                showSlide(Number(dot.getAttribute('data-hero-index')) || 0);
            });
        });

        window.setInterval(function () {
            showSlide(current + 1);
        }, 5200);
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function applyFilter(scopeSelector) {
        var scope = document.querySelector(scopeSelector);

        if (!scope) {
            return;
        }

        var panel = document.querySelector('[data-filter-scope="' + scopeSelector + '"]');
        var input = document.querySelector('[data-search-scope="' + scopeSelector + '"]');
        var keyword = normalize(input ? input.value : '');
        var activeFilters = {};

        if (panel) {
            panel.querySelectorAll('.filter-button.active').forEach(function (button) {
                var field = button.getAttribute('data-filter-field');
                var value = button.getAttribute('data-filter-value');

                if (field && value && value !== '全部') {
                    activeFilters[field] = value;
                }
            });
        }

        var visibleCount = 0;
        var items = Array.prototype.slice.call(scope.querySelectorAll('.searchable-item'));

        items.forEach(function (item) {
            var haystack = normalize([
                item.getAttribute('data-title'),
                item.getAttribute('data-region'),
                item.getAttribute('data-year'),
                item.getAttribute('data-type'),
                item.getAttribute('data-genre'),
                item.getAttribute('data-tags')
            ].join(' '));
            var matched = !keyword || haystack.indexOf(keyword) !== -1;

            Object.keys(activeFilters).forEach(function (field) {
                if (normalize(item.getAttribute('data-' + field)) !== normalize(activeFilters[field])) {
                    matched = false;
                }
            });

            item.classList.toggle('is-hidden', !matched);

            if (matched) {
                visibleCount += 1;
            }
        });

        var empty = document.querySelector('[data-empty-for="' + scopeSelector + '"]');

        if (empty) {
            empty.classList.toggle('is-visible', visibleCount === 0);
        }
    }

    document.querySelectorAll('[data-filter-scope]').forEach(function (panel) {
        var scopeSelector = panel.getAttribute('data-filter-scope');
        var input = document.querySelector('[data-search-scope="' + scopeSelector + '"]');

        if (input) {
            input.addEventListener('input', function () {
                applyFilter(scopeSelector);
            });
        }

        panel.querySelectorAll('.filter-button').forEach(function (button) {
            button.addEventListener('click', function () {
                var field = button.getAttribute('data-filter-field');

                panel.querySelectorAll('.filter-button[data-filter-field="' + field + '"]').forEach(function (item) {
                    item.classList.remove('active');
                });

                button.classList.add('active');
                applyFilter(scopeSelector);
            });
        });
    });

    function cardTemplate(item) {
        return [
            '<a class="movie-card" href="' + item.url + '">',
            '    <figure class="movie-poster">',
            '        <img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
            '        <span class="type-badge">' + escapeHtml(item.type) + '</span>',
            '    </figure>',
            '    <div class="movie-card-body">',
            '        <h3>' + escapeHtml(item.title) + '</h3>',
            '        <p>' + escapeHtml(item.oneLine) + '</p>',
            '        <div class="movie-meta">',
            '            <span>' + escapeHtml(item.region) + '</span>',
            '            <span>' + escapeHtml(item.year) + '</span>',
            '        </div>',
            '        <div class="movie-tags">' + escapeHtml(item.genre) + '</div>',
            '    </div>',
            '</a>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    var globalInput = document.getElementById('globalSearch');
    var globalResults = document.getElementById('searchResults');
    var globalTitle = document.getElementById('searchTitle');
    var globalCount = document.getElementById('searchCount');

    if (globalInput && globalResults && window.SEARCH_INDEX) {
        globalInput.addEventListener('input', function () {
            var keyword = normalize(globalInput.value);

            if (!keyword) {
                globalTitle.textContent = '推荐浏览';
                globalCount.textContent = '输入关键词后可查看全站匹配影片。';
                globalResults.innerHTML = window.SEARCH_INDEX.slice(0, 60).map(cardTemplate).join('');
                return;
            }

            var matched = window.SEARCH_INDEX.filter(function (item) {
                return normalize([
                    item.title,
                    item.region,
                    item.year,
                    item.type,
                    item.genre,
                    item.tags,
                    item.oneLine
                ].join(' ')).indexOf(keyword) !== -1;
            }).slice(0, 120);

            globalTitle.textContent = '搜索结果';
            globalCount.textContent = '找到 ' + matched.length + ' 条匹配影片，最多显示 120 条。';
            globalResults.innerHTML = matched.map(cardTemplate).join('');
        });
    }

    var player = document.getElementById('moviePlayer');

    if (player) {
        var overlay = document.querySelector('[data-player-action="play"]');
        var sourceButtons = document.querySelectorAll('[data-source]');
        var hlsInstance = null;

        function getSource() {
            return player.getAttribute('data-src');
        }

        function preparePlayer() {
            var source = getSource();

            if (!source) {
                return;
            }

            if (player.canPlayType('application/vnd.apple.mpegurl')) {
                if (player.src !== source) {
                    player.src = source;
                }
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                if (!hlsInstance) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });

                    hlsInstance.attachMedia(player);
                }

                hlsInstance.loadSource(source);
                return;
            }

            if (player.src !== source) {
                player.src = source;
            }
        }

        function playPlayer() {
            preparePlayer();

            var playPromise = player.play();

            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.catch(function () {
                    if (overlay) {
                        overlay.classList.remove('is-hidden');
                    }
                });
            }

            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        }

        if (overlay) {
            overlay.addEventListener('click', playPlayer);
        }

        player.addEventListener('play', function () {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });

        player.addEventListener('pause', function () {
            if (overlay && player.currentTime === 0) {
                overlay.classList.remove('is-hidden');
            }
        });

        sourceButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                sourceButtons.forEach(function (item) {
                    item.classList.remove('active');
                });

                button.classList.add('active');
                player.setAttribute('data-src', button.getAttribute('data-source'));

                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }

                player.removeAttribute('src');
                player.load();
                playPlayer();
            });
        });
    }
})();
