(function () {
    var startFaceDetectBtn = document.querySelector('#startFaceDetect');

    // 画布控制器
    var CanvasCtrl = {
        canvas: null,
        ctx: null,
        score: null,
        setCanvasSize: function () {
            if (!this.canvas) return;
            this.canvas.width = parseFloat(window.getComputedStyle(MediaCtrl.video).width);
            this.canvas.height = parseFloat(window.getComputedStyle(MediaCtrl.video).height);
        },
        setCanvas: function () {
            var canvas = document.createElement('canvas');
            canvas.id = 'webrtcCanvas';

            var score = document.createElement('span');
            score.id = 'faceScore';

            MediaCtrl.videoWrapper.appendChild(canvas);
            MediaCtrl.demoWrapper.appendChild(score);

            this.canvas = document.querySelector('#webrtcCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.score = document.querySelector('#faceScore');
        },
        removeCanvas: function () {
            try {
                MediaCtrl.videoWrapper.removeChild(this.canvas);
                MediaCtrl.demoWrapper.removeChild(this.score);
                this.canvas = this.score = null;
            } catch (error) { }
        }
    };

    // 人脸识别控制器
    var FaceDetectCtrl = {
        ctracker: null,
        ctrackerTimer: -1,
        passScore: 60,
        goodScore: 70,
        throttle: true,
        start: function () {
            if (!CanvasCtrl.canvas) return;

            if (!this.ctracker) {
                this.ctracker = new clm.tracker();
                this.ctracker.init();
            } else this.stop();

            this.ctracker.start(MediaCtrl.video);
            this.detect();
        },
        detect: function () {
            this.ctrackerTimer = requestAnimationFrame(this.detect.bind(this));

            CanvasCtrl.ctx.clearRect(0, 0, CanvasCtrl.canvas.width, CanvasCtrl.canvas.height);
            
            if (this.ctracker.getCurrentPosition()) {
                var score = Math.round(this.ctracker.getScore() * 100);
                FaceDetectCtrl.setFaceScore(score);
                if (score >= this.passScore) {
                    this.ctracker.draw(CanvasCtrl.canvas);
                }
            } else {
                FaceDetectCtrl.setFaceScore(0);
            }
        },
        setFaceScore: function (score) {
            var _this = this;
            if (!CanvasCtrl.score) return;
            if (+CanvasCtrl.score.innerText === score) return;
            if (!_this.throttle) return;

            _this.throttle = false;

            setTimeout(function () {
                if (CanvasCtrl.score) {
                    var color = score >= _this.goodScore ? 'green'
                        : score >= _this.passScore ? 'yellow' : '';
                    CanvasCtrl.score.className = color;
                    CanvasCtrl.score.innerText = score;
                }
                _this.throttle = true;
            }, 500);
        },
        stop: function () {
            if (!this.ctracker || !CanvasCtrl.canvas) return;
            this.ctracker.stop();
            this.ctracker.reset();
            CanvasCtrl.ctx.clearRect(0, 0, CanvasCtrl.canvas.width, CanvasCtrl.canvas.height);
            cancelAnimationFrame(this.ctrackerTimer);
        }
    };

    startFaceDetectBtn.addEventListener('click', function () {
        // 监听关闭按钮
        MediaCtrl.listenClose(function () {
            // 停止识别
            FaceDetectCtrl.stop();
            // 移除canvas
            CanvasCtrl.removeCanvas();
        });
        // 监听video变化
        MediaCtrl.listenResize(function () {
            logger('setCanvasSize', '设置canvas宽高');
            CanvasCtrl.setCanvasSize();
            FaceDetectCtrl.start();
        });
        // 调用摄像头
        MediaCtrl.start().then(function () {
            // 设置canvas
            CanvasCtrl.setCanvas();
            CanvasCtrl.setCanvasSize();
            // 开始识别人脸
            FaceDetectCtrl.start();
        }).catch(function (error) {
            logger('getUserMedia', error);

            FaceDetectCtrl.stop();
            CanvasCtrl.removeCanvas();
        })
    });
})();