(() => {
  const mobileButton = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (mobileButton && mobileNav) {
    mobileButton.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }

  const hero = document.querySelector('[data-hero]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    let current = 0;

    const showSlide = (index) => {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === current);
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === current);
      });
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => showSlide(index));
    });

    window.setInterval(() => {
      showSlide(current + 1);
    }, 5200);
  }

  const normalizeText = (value) => {
    return String(value || '').trim().toLowerCase();
  };

  const filterContainers = Array.from(document.querySelectorAll('[data-card-list]'));

  filterContainers.forEach((container) => {
    const scope = container.parentElement || document;
    const searchInput = scope.querySelector('[data-card-search]');
    const yearFilter = scope.querySelector('[data-year-filter]');
    const result = scope.querySelector('[data-filter-result]');
    const cards = Array.from(container.querySelectorAll('.movie-card'));

    const updateFilter = () => {
      const query = normalizeText(searchInput ? searchInput.value : '');
      const year = yearFilter ? yearFilter.value : '';
      let visible = 0;

      cards.forEach((card) => {
        const haystack = normalizeText([
          card.dataset.title,
          card.dataset.region,
          card.dataset.genre,
          card.dataset.tags,
          card.dataset.year,
        ].join(' '));
        const matchesQuery = !query || haystack.includes(query);
        const matchesYear = !year || card.dataset.year === year;
        const shouldShow = matchesQuery && matchesYear;

        card.classList.toggle('is-hidden', !shouldShow);

        if (shouldShow) {
          visible += 1;
        }
      });

      if (result) {
        result.textContent = `显示 ${visible} 部`;
      }
    };

    if (searchInput) {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');

      if (q) {
        searchInput.value = q;
      }

      searchInput.addEventListener('input', updateFilter);
    }

    if (yearFilter) {
      yearFilter.addEventListener('change', updateFilter);
    }

    updateFilter();
  });

  const players = Array.from(document.querySelectorAll('[data-player]'));
  window.__classicMoviePlayers = window.__classicMoviePlayers || [];

  const startPlayer = (shell) => {
    const video = shell.querySelector('video');

    if (!video) {
      return;
    }

    const source = video.dataset.src;

    if (!source) {
      return;
    }

    const playNow = () => {
      shell.classList.add('playing');
      const attempt = video.play();

      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(() => {
          shell.classList.remove('playing');
        });
      }
    };

    if (video.dataset.ready === 'true') {
      playNow();
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.dataset.ready = 'true';
      playNow();
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(source);
      hls.attachMedia(video);
      window.__classicMoviePlayers.push(hls);
      video.dataset.ready = 'true';

      hls.on(window.Hls.Events.MANIFEST_PARSED, playNow);
      return;
    }

    video.src = source;
    video.dataset.ready = 'true';
    playNow();
  };

  players.forEach((shell) => {
    const button = shell.querySelector('[data-play-button]');
    const video = shell.querySelector('video');

    if (button) {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        startPlayer(shell);
      });
    }

    if (video) {
      video.addEventListener('play', () => {
        shell.classList.add('playing');
      });

      video.addEventListener('pause', () => {
        if (video.currentTime === 0 || video.ended) {
          shell.classList.remove('playing');
        }
      });

      video.addEventListener('click', () => {
        if (!video.dataset.ready) {
          startPlayer(shell);
        }
      });
    }
  });
})();
