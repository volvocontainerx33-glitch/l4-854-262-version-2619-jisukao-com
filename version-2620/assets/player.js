(function () {
  function setupPlayer(box) {
    var video = box.querySelector('video');
    var button = box.querySelector('.play-overlay');
    var src = box.getAttribute('data-video-source');
    var started = false;
    var hls = null;

    function setButtonText(text) {
      if (!button) return;
      var label = button.querySelector('b');
      if (label) label.textContent = text;
    }

    function start() {
      if (!video || !src) return;
      if (started) {
        video.play().catch(function () {});
        return;
      }
      started = true;
      if (button) button.classList.add('hidden');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', function () {
          video.play().catch(function () {});
        }, { once: true });
        video.load();
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) return;
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            if (button) button.classList.remove('hidden');
            setButtonText('重新播放');
          }
        });
        return;
      }

      started = false;
      if (button) button.classList.remove('hidden');
      setButtonText('播放暂时不可用');
    }

    if (button) button.addEventListener('click', start);
    if (video) video.addEventListener('click', start);
    window.addEventListener('beforeunload', function () {
      if (hls) hls.destroy();
    });
  }

  if (document.readyState !== 'loading') {
    Array.prototype.slice.call(document.querySelectorAll('.player-card')).forEach(setupPlayer);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      Array.prototype.slice.call(document.querySelectorAll('.player-card')).forEach(setupPlayer);
    });
  }
})();
