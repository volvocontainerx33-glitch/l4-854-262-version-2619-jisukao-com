(function () {
    function setupPlayer(wrapper) {
        var video = wrapper.querySelector('video');
        var cover = wrapper.querySelector('.player-cover');
        var url = wrapper.getAttribute('data-video');
        var ready = false;
        var hls = null;

        function attach() {
            if (ready || !video || !url) {
                return;
            }
            ready = true;
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 60
                });
                hls.loadSource(url);
                hls.attachMedia(video);
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
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            }
        }

        function play() {
            attach();
            if (cover) {
                cover.classList.add('is-hidden');
            }
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {});
            }
        }

        if (cover) {
            cover.addEventListener('click', play);
        }
        if (video) {
            video.addEventListener('click', function () {
                if (video.paused) {
                    play();
                }
            });
            video.addEventListener('play', function () {
                if (cover) {
                    cover.classList.add('is-hidden');
                }
            });
        }
        window.addEventListener('beforeunload', function () {
            if (hls) {
                hls.destroy();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        Array.prototype.slice.call(document.querySelectorAll('.js-player')).forEach(setupPlayer);
    });
})();
