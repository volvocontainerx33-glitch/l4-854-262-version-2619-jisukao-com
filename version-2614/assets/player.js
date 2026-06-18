(function () {
  function setupPlayer(options) {
    var video = document.getElementById(options.videoId);
    var button = document.querySelector(options.buttonSelector);
    var started = false;
    var hls = null;

    if (!video) {
      return;
    }

    function playVideo() {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    function hideButton() {
      if (button) {
        button.classList.add('is-hidden');
      }
    }

    function start() {
      if (started) {
        hideButton();
        playVideo();
        return;
      }

      started = true;
      hideButton();

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = options.url;
        playVideo();
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(options.url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          playVideo();
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        });
        return;
      }

      video.src = options.url;
      playVideo();
    }

    if (button) {
      button.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });

    video.addEventListener('play', hideButton);

    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  window.setupPlayer = setupPlayer;
})();
