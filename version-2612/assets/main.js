(function () {
    var menuButton = document.querySelector('.mobile-menu-button');
    var mobilePanel = document.querySelector('.mobile-panel');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            var isOpen = mobilePanel.classList.toggle('open');
            menuButton.classList.toggle('open', isOpen);
            menuButton.setAttribute('aria-expanded', String(isOpen));
        });
    }

    var hero = document.querySelector('[data-hero-slider]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
        var previous = hero.querySelector('.hero-prev');
        var next = hero.querySelector('.hero-next');
        var activeIndex = 0;
        var timer = null;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }

            activeIndex = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === activeIndex);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === activeIndex);
            });
        }

        function startTimer() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                showSlide(activeIndex + 1);
            }, 5000);
        }

        if (previous) {
            previous.addEventListener('click', function () {
                showSlide(activeIndex - 1);
                startTimer();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                showSlide(activeIndex + 1);
                startTimer();
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
                startTimer();
            });
        });

        showSlide(0);
        startTimer();
    }

    var searchInput = document.querySelector('[data-search-input]');
    var yearSelect = document.querySelector('[data-year-filter]');
    var typeSelect = document.querySelector('[data-type-filter]');
    var searchableCards = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
    var emptyState = document.querySelector('[data-empty-state]');

    function normalizeText(value) {
        return String(value || '').trim().toLowerCase();
    }

    function applySearch() {
        var keyword = normalizeText(searchInput ? searchInput.value : '');
        var year = yearSelect ? yearSelect.value : '';
        var type = typeSelect ? typeSelect.value : '';
        var visibleCount = 0;

        searchableCards.forEach(function (card) {
            var text = normalizeText(card.getAttribute('data-search'));
            var cardYear = card.getAttribute('data-year') || '';
            var cardType = card.getAttribute('data-type') || '';
            var matched = true;

            if (keyword && text.indexOf(keyword) === -1) {
                matched = false;
            }

            if (year && cardYear !== year) {
                matched = false;
            }

            if (type && cardType !== type) {
                matched = false;
            }

            card.style.display = matched ? '' : 'none';

            if (matched) {
                visibleCount += 1;
            }
        });

        if (emptyState) {
            emptyState.classList.toggle('visible', visibleCount === 0);
        }
    }

    if (searchInput || yearSelect || typeSelect) {
        if (searchInput) {
            searchInput.addEventListener('input', applySearch);
        }

        if (yearSelect) {
            yearSelect.addEventListener('change', applySearch);
        }

        if (typeSelect) {
            typeSelect.addEventListener('change', applySearch);
        }

        applySearch();
    }
})();

function initPlayer(sourceUrl) {
    var video = document.getElementById('movie-player');
    var layer = document.querySelector('.play-layer');
    var action = document.querySelector('.play-action');
    var hlsInstance = null;
    var attached = false;

    if (!video || !sourceUrl) {
        return;
    }

    function attachSource() {
        if (attached) {
            return;
        }

        attached = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = sourceUrl;
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });

            hlsInstance.loadSource(sourceUrl);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                if (!data || !data.fatal) {
                    return;
                }

                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                    hlsInstance.startLoad();
                } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                    hlsInstance.recoverMediaError();
                } else {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
            });
        } else {
            video.src = sourceUrl;
        }
    }

    function beginPlayback() {
        attachSource();

        var playPromise = video.play();

        if (layer) {
            layer.classList.add('hidden');
        }

        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
                if (layer) {
                    layer.classList.remove('hidden');
                }
            });
        }
    }

    if (layer) {
        layer.addEventListener('click', beginPlayback);
    }

    if (action) {
        action.addEventListener('click', function (event) {
            event.stopPropagation();
            beginPlayback();
        });
    }

    video.addEventListener('play', function () {
        if (layer) {
            layer.classList.add('hidden');
        }
    });

    video.addEventListener('pause', function () {
        if (!video.ended && video.currentTime === 0 && layer) {
            layer.classList.remove('hidden');
        }
    });

    window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
