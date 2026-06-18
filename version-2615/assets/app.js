(function () {
  function qs(scope, selector) {
    return scope.querySelector(selector);
  }

  function qsa(scope, selector) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupSearch() {
    var index = window.SEARCH_INDEX || [];
    qsa(document, "[data-search-box]").forEach(function (box) {
      var input = qs(box, "[data-search-input]");
      var results = qs(box, "[data-search-results]");
      if (!input || !results) {
        return;
      }
      input.addEventListener("input", function () {
        var query = input.value.trim().toLowerCase();
        if (!query) {
          results.classList.remove("is-open");
          results.innerHTML = "";
          return;
        }
        var matches = index.filter(function (item) {
          var haystack = [item.title, item.region, item.year, item.type, item.genre, item.desc].join(" ").toLowerCase();
          return haystack.indexOf(query) !== -1;
        }).slice(0, 10);
        if (!matches.length) {
          results.innerHTML = '<div class="search-result-item"><span></span><span>没有找到匹配内容</span></div>';
          results.classList.add("is-open");
          return;
        }
        results.innerHTML = matches.map(function (item) {
          return '<a class="search-result-item" href="' + escapeHtml(item.href) + '">' +
            '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '">' +
            '<span><strong>' + escapeHtml(item.title) + '</strong>' +
            '<span>' + escapeHtml(item.region) + ' · ' + escapeHtml(item.year) + ' · ' + escapeHtml(item.type) + '</span>' +
            '<span>' + escapeHtml(item.desc) + '</span></span></a>';
        }).join("");
        results.classList.add("is-open");
      });
      document.addEventListener("click", function (event) {
        if (!box.contains(event.target)) {
          results.classList.remove("is-open");
        }
      });
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = qsa(hero, "[data-hero-slide]");
    var dots = qsa(hero, "[data-hero-dot]");
    var prev = qs(hero, "[data-hero-prev]");
    var next = qs(hero, "[data-hero-next]");
    var current = 0;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
      });
    });
    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
      });
    }
    if (slides.length > 1) {
      window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }
  }

  function setupFilters() {
    qsa(document, "[data-filter-scope]").forEach(function (scope) {
      var input = qs(scope, "[data-card-filter]");
      var count = qs(scope, "[data-filter-count]");
      var cards = qsa(scope, "[data-movie-card]");
      var buttons = qsa(scope, "[data-filter-value]");
      var activeYear = "";
      function apply() {
        var query = input ? input.value.trim().toLowerCase() : "";
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = [card.dataset.title, card.dataset.region, card.dataset.year, card.dataset.genre, card.dataset.tags].join(" ").toLowerCase();
          var yearMatch = !activeYear || card.dataset.year === activeYear;
          var queryMatch = !query || haystack.indexOf(query) !== -1;
          var show = yearMatch && queryMatch;
          card.classList.toggle("is-hidden", !show);
          if (show) {
            visible += 1;
          }
        });
        if (count) {
          count.textContent = visible + " 部";
        }
      }
      if (input) {
        input.addEventListener("input", apply);
      }
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          buttons.forEach(function (item) {
            item.classList.remove("is-active");
          });
          button.classList.add("is-active");
          activeYear = button.dataset.filterValue || "";
          apply();
        });
      });
      apply();
    });
  }

  function setupPlayers() {
    qsa(document, "[data-player]").forEach(function (box) {
      var video = qs(box, "video");
      var button = qs(box, "[data-play-button]");
      var message = qs(box, "[data-player-message]");
      var source = box.getAttribute("data-src");
      var attached = false;
      var hlsInstance = null;

      function showMessage(text) {
        if (!message) {
          return;
        }
        message.textContent = text;
        message.classList.add("is-open");
        window.setTimeout(function () {
          message.classList.remove("is-open");
        }, 3600);
      }

      function attachSource() {
        if (attached || !video || !source) {
          return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
            if (data && data.fatal) {
              showMessage("播放暂时不可用");
            }
          });
        } else {
          video.src = source;
        }
      }

      function startPlayback() {
        attachSource();
        if (button) {
          button.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            showMessage("请再次点击播放");
            if (button) {
              button.classList.remove("is-hidden");
            }
          });
        }
      }

      if (!video || !button) {
        return;
      }
      button.addEventListener("click", startPlayback);
      video.addEventListener("play", function () {
        if (button) {
          button.classList.add("is-hidden");
        }
      });
      video.addEventListener("pause", function () {
        if (video.currentTime === 0 || video.ended) {
          if (button) {
            button.classList.remove("is-hidden");
          }
        }
      });
      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupSearch();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
