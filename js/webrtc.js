var MediaCtrl = {
    demoWrapper: document.querySelector('.webrtc-demo'),
    videoWrapper: document.querySelector('.video-wrapper'),
    video: document.querySelector('#localVideo'),
    stream: null,
    closeBtn: null,
    closeCb: null,
    canResolve: true,
    ratio: 0, // video宽高比例
    resizeTimer: -1,
    resizeCb: null,
    start: function () {
        var _this = this;
        _this.canResolve = true;
        _this.setMedia();
        _this.setCloseBtn();

        return new Promise(function (resolve, reject) {
            try {
                navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: {
                        facingMode: 'user', // 优先使用前置摄像头
                        width: 1280,
                        height: 720
                    }
                }).then(function (localMediaStream) {
                    if (!_this.canResolve) {
                        _this.stop(localMediaStream);
                        return;
                    }

                    _this.stream = localMediaStream;
                    _this.video.onloadedmetadata = function () {
                        _this.video.play();
                        _this.setVideoSize(true);
                        _this.addResizeListener();
                        resolve();
                    };

                    if ('srcObject' in _this.video) {
                        _this.video.srcObject = localMediaStream;
                    } else {
                        _this.video.src = (window.URL && window.URL.createObjectURL(localMediaStream));
                    }
                }).catch(function (error) {
                    _this.stop();
                    reject(error);
                });
            } catch (error) {
                _this.stop();
                reject(error);
            }
        });
    },
    stop: function (stream) {
        try {
            this.stream.getTracks().forEach(function (track) {
                track.stop();
            });
        } catch (error) { }

        try {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
        } catch (error) { }

        this.canResolve = false;
        this.video.pause();
        this.video.srcObject = null;
        this.removeCloseBtn();
        this.removeMedia();
        this.removeResizeListener();
    },
    setMedia: function () {
        this.demoWrapper.style.display = 'flex';
    },
    removeMedia: function () {
        this.demoWrapper.style.display = '';
    },
    setCloseBtn: function () {
        var _this = this;

        var closeBtn = document.createElement('button');
        closeBtn.id = 'webrtcClose';
        closeBtn.innerText = '╳';
        closeBtn.addEventListener('click', function () {
            _this.closeCb && _this.closeCb();
            _this.stop();
        });

        _this.demoWrapper.appendChild(closeBtn);
        _this.closeBtn = document.querySelector('#webrtcClose');
    },
    removeCloseBtn: function () {
        try {
            this.demoWrapper.removeChild(this.closeBtn);
            this.closeBtn = this.closeCb = null;
        } catch (error) { }
    },
    listenClose: function (closeCb) {
        this.closeCb = closeCb;
    },
    setVideoSize: function (isFirst) {
        var _this = MediaCtrl;

        var _setVideoSize = function () {
            _this.video.width = parseFloat(window.getComputedStyle(_this.video).width);

            if (_this.ratio) {
                _this.video.height = _this.video.width / _this.ratio;
            } else {
                _this.video.height = parseFloat(window.getComputedStyle(_this.video).height);
                _this.ratio = _this.video.width / _this.video.height;
            }
            logger('setVideoSize', '设置video宽高');
            _this.resizeCb && _this.resizeCb();
        }

        if (isFirst == true) {
            _setVideoSize();
        } else {
            clearTimeout(_this.resizeTimer);
            _this.resizeTimer = setTimeout(_setVideoSize, 500);
        }
    },
    listenResize: function (resizeCb) {
        this.resizeCb = resizeCb;
    },
    addResizeListener: function () {
        window.addEventListener('resize', this.setVideoSize);
    },
    removeResizeListener: function () {
        clearTimeout(this.resizeTimer);

        this.resizeCb = null;
        this.ratio = 0;
        this.resizeTimer = -1;
        this.video.removeAttribute('width');
        this.video.removeAttribute('height');

        window.removeEventListener('resize', this.setVideoSize);
    }
};