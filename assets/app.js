(function () {
  const state = {
    hlsPromise: null,
    players: []
  };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text !== undefined) {
      element.textContent = text;
    }
    return element;
  }

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (state.hlsPromise) {
      return state.hlsPromise;
    }
    state.hlsPromise = new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return state.hlsPromise;
  }

  function prepareVideo(video, url) {
    if (!video || !url) {
      return Promise.resolve();
    }
    if (video.dataset.ready === "true") {
      return Promise.resolve();
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.dataset.ready = "true";
      return Promise.resolve();
    }
    return loadHls().then(function (Hls) {
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        state.players.push(hls);
        video.dataset.ready = "true";
      } else {
        video.src = url;
        video.dataset.ready = "true";
      }
    }).catch(function () {
      video.src = url;
      video.dataset.ready = "true";
    });
  }

  function initPlayers() {
    qsa("[data-player]").forEach(function (player) {
      const video = qs("video", player);
      const overlay = qs(".play-overlay", player);
      const url = player.getAttribute("data-hls-url");
      prepareVideo(video, url);
      function start() {
        prepareVideo(video, url).then(function () {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {});
          }
        });
      }
      if (overlay) {
        overlay.addEventListener("click", start);
      }
      if (video) {
        video.addEventListener("play", function () {
          if (overlay) {
            overlay.classList.add("is-hidden");
          }
        });
        video.addEventListener("click", function () {
          if (video.paused) {
            start();
          }
        });
      }
    });
  }

  function initMenu() {
    const button = qs("[data-menu-button]");
    const panel = qs("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function initHero() {
    const hero = qs("[data-hero]");
    if (!hero) {
      return;
    }
    const slides = qsa("[data-hero-slide]", hero);
    const dots = qsa("[data-hero-dot]", hero);
    const prev = qs("[data-hero-prev]", hero);
    const next = qs("[data-hero-next]", hero);
    let index = 0;
    let timer = null;
    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle("is-active", itemIndex === index);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle("is-active", itemIndex === index);
      });
    }
    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(index + 1);
      }, 5000);
    }
    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.dataset.heroDot || 0));
        restart();
      });
    });
    restart();
  }

  function initCardFilters() {
    qsa("[data-card-grid]").forEach(function (grid) {
      const section = grid.closest("section") || document;
      const input = qs("[data-card-filter]", section);
      const sort = qs("[data-card-sort]", section);
      const cards = qsa("[data-card]", grid);
      const empty = createElement("div", "empty-state", "没有匹配的影片内容");
      function apply() {
        const query = input ? input.value.trim().toLowerCase() : "";
        const mode = sort ? sort.value : "default";
        let visible = 0;
        cards.forEach(function (card) {
          const target = (card.dataset.keywords || card.dataset.title || "").toLowerCase();
          const matched = !query || target.indexOf(query) !== -1;
          card.classList.toggle("hidden-card", !matched);
          if (matched) {
            visible += 1;
          }
        });
        const sorted = cards.slice().sort(function (a, b) {
          if (mode === "views") {
            return Number(b.dataset.views || 0) - Number(a.dataset.views || 0);
          }
          if (mode === "rating") {
            return Number(b.dataset.rating || 0) - Number(a.dataset.rating || 0);
          }
          if (mode === "year") {
            return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
          }
          return 0;
        });
        sorted.forEach(function (card) {
          grid.appendChild(card);
        });
        if (visible === 0) {
          if (!empty.parentNode) {
            grid.appendChild(empty);
          }
        } else if (empty.parentNode) {
          empty.parentNode.removeChild(empty);
        }
      }
      if (input) {
        input.addEventListener("input", apply);
      }
      if (sort) {
        sort.addEventListener("change", apply);
      }
    });
  }

  function movieCard(movie) {
    const article = createElement("article", "movie-card");
    const link = createElement("a");
    link.href = movie.url;
    const cover = createElement("div", "card-cover");
    const img = createElement("img");
    img.src = movie.cover;
    img.alt = movie.title;
    img.loading = "lazy";
    img.decoding = "async";
    const duration = createElement("span", "card-duration", movie.duration);
    const category = createElement("span", "card-category", movie.category);
    const play = createElement("span", "card-play", "▶");
    const body = createElement("div", "card-body");
    const title = createElement("h3", "", movie.title);
    const desc = createElement("p", "", movie.one_line || movie.summary || "");
    const meta = createElement("div", "card-meta");
    meta.appendChild(createElement("span", "", String(movie.year || "")));
    meta.appendChild(createElement("span", "", movie.region || ""));
    meta.appendChild(createElement("span", "", "★ " + (movie.rating || "")));
    cover.appendChild(img);
    cover.appendChild(duration);
    cover.appendChild(category);
    cover.appendChild(play);
    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(meta);
    link.appendChild(cover);
    link.appendChild(body);
    article.appendChild(link);
    return article;
  }

  function initSearchPage() {
    const form = qs("[data-search-form]");
    const results = qs("[data-search-results]");
    if (!form || !results || !window.SiteMovies) {
      return;
    }
    const input = qs("input[name='q']", form);
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") || "";
    input.value = initial;
    function render(query) {
      const term = query.trim().toLowerCase();
      results.innerHTML = "";
      const source = window.SiteMovies.filter(function (movie) {
        if (!term) {
          return true;
        }
        const target = [movie.title, movie.region, movie.type, movie.genre, movie.category, (movie.tags || []).join(" "), movie.one_line].join(" ").toLowerCase();
        return target.indexOf(term) !== -1;
      }).slice(0, 240);
      if (!source.length) {
        results.appendChild(createElement("div", "empty-state", "没有匹配的影片内容"));
        return;
      }
      source.forEach(function (movie) {
        results.appendChild(movieCard(movie));
      });
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const term = input.value.trim();
      const url = term ? "./search.html?q=" + encodeURIComponent(term) : "./search.html";
      window.history.replaceState(null, "", url);
      render(term);
    });
    input.addEventListener("input", function () {
      render(input.value);
    });
    render(initial);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initHero();
    initCardFilters();
    initSearchPage();
    initPlayers();
  });
})();
