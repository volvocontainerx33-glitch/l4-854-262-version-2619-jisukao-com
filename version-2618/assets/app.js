(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  var toggle = qs(".mobile-toggle");
  var panel = qs(".mobile-panel");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var opened = panel.hasAttribute("hidden");
      if (opened) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
      toggle.setAttribute("aria-expanded", opened ? "true" : "false");
      toggle.textContent = opened ? "×" : "☰";
    });
  }

  var hero = qs(".hero-slider");
  if (hero) {
    var slides = qsa(".hero-slide", hero);
    var dots = qsa(".hero-dot", hero);
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    function next() {
      show(current + 1);
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(next, 5000);
    }

    qsa("[data-hero-next]", hero).forEach(function (button) {
      button.addEventListener("click", function () {
        next();
        restart();
      });
    });

    qsa("[data-hero-prev]", hero).forEach(function (button) {
      button.addEventListener("click", function () {
        show(current - 1);
        restart();
      });
    });

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });

    show(0);
    restart();
  }

  var filterGrid = qs("[data-filter-grid]");
  if (filterGrid) {
    var filterInput = qs("[data-filter-input]");
    var yearSelect = qs("[data-year-filter]");
    var typeSelect = qs("[data-type-filter]");
    var cards = qsa(".movie-card", filterGrid);

    function applyFilters() {
      var keyword = (filterInput && filterInput.value ? filterInput.value : "").trim().toLowerCase();
      var year = yearSelect ? yearSelect.value : "";
      var type = typeSelect ? typeSelect.value : "";
      cards.forEach(function (card) {
        var text = ((card.getAttribute("data-title") || "") + " " + (card.getAttribute("data-tags") || "")).toLowerCase();
        var yearOk = !year || card.getAttribute("data-year") === year;
        var typeOk = !type || (card.getAttribute("data-type") || "").indexOf(type) !== -1;
        var keyOk = !keyword || text.indexOf(keyword) !== -1;
        card.hidden = !(yearOk && typeOk && keyOk);
      });
    }

    [filterInput, yearSelect, typeSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilters);
        control.addEventListener("change", applyFilters);
      }
    });
  }

  var searchRoot = qs("[data-search-root]");
  if (searchRoot && window.SEARCH_MOVIES) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    var input = qs("[data-search-box]");
    var resultGrid = qs("[data-search-results]");
    var status = qs("[data-search-status]");
    if (input) {
      input.value = query;
    }

    function cardTemplate(item) {
      return "<article class=\"movie-card\">" +
        "<a class=\"movie-cover\" href=\"./" + escapeHtml(item.url) + "\" aria-label=\"" + escapeHtml(item.title) + "\">" +
        "<img src=\"" + escapeHtml(item.cover) + "\" alt=\"" + escapeHtml(item.title) + "\" loading=\"lazy\">" +
        "<span class=\"cover-shade\"></span><span class=\"play-mark\">▶</span>" +
        "<span class=\"type-pill\">" + escapeHtml(item.type) + "</span>" +
        "<span class=\"duration-pill\">" + escapeHtml(item.duration) + "</span>" +
        "</a><div class=\"movie-card-body\">" +
        "<h3><a href=\"./" + escapeHtml(item.url) + "\">" + escapeHtml(item.title) + "</a></h3>" +
        "<p>" + escapeHtml(item.desc) + "</p>" +
        "<div class=\"movie-meta\"><span>" + escapeHtml(item.year) + "</span><span>" + escapeHtml(item.region) + "</span><span>★ " + escapeHtml(item.rating) + "</span></div>" +
        "</div></article>";
    }

    function render(value) {
      var key = String(value || "").trim().toLowerCase();
      var list = window.SEARCH_MOVIES.filter(function (item) {
        if (!key) {
          return true;
        }
        var text = [item.title, item.desc, item.genre, item.tags, item.region, item.type, item.year].join(" ").toLowerCase();
        return text.indexOf(key) !== -1;
      }).slice(0, 120);
      if (status) {
        status.textContent = key ? "与“" + value + "”相关的剧集" : "精选剧集搜索";
      }
      if (resultGrid) {
        resultGrid.innerHTML = list.length ? list.map(cardTemplate).join("") : "<div class=\"no-result\">没有找到匹配内容</div>";
      }
    }

    if (input) {
      input.addEventListener("input", function () {
        render(input.value);
      });
    }
    render(query);
  }
})();
