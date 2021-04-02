(function () {
    var aliveDetect = document.querySelectorAll('.aliveDetect');

    // 画布控制器
    var CanvasCtrl = {
        canvas: null,
        ctx: null,
        setCanvasSize: function () {
            if (!this.canvas) return;
            this.canvas.width = parseFloat(window.getComputedStyle(MediaCtrl.video).width);
            this.canvas.height = parseFloat(window.getComputedStyle(MediaCtrl.video).height);
        },
        setCanvas: function () {
            var canvas = document.createElement('canvas');
            canvas.id = 'webrtcCanvas';

            MediaCtrl.videoWrapper.appendChild(canvas);

            this.canvas = document.querySelector('#webrtcCanvas');
            this.ctx = this.canvas.getContext('2d');
        },
        removeCanvas: function () {
            try {
                MediaCtrl.videoWrapper.removeChild(this.canvas);
                MediaCtrl.demoWrapper.removeChild(this.score);
                this.canvas = this.score = null;
            } catch (error) { }
        }
    };

    var AliveDetectCtrl = {
        action: '',
        mouseTip: '请张合嘴巴',
        headTip: '请缓慢摇头',
        eyeTip: '请眨眼',
        mouseCount: 0,
        headCount: 0,
        eyeCount: 0,
        passCount: 1, // 通过检测的触发次数
        init: function () {
            this.last_time = 0;
            this.last_nose_left = 0;
            this.last_nose_top = 0;

            this.last_dis_mouse = 0;

            this.last_dis_eye_norse = 100000000;
            this.last_dis_left_right = 100000000;

            this.mouseCount = 0;
            this.headCount = 0;
            this.eyeCount = 0;
        },
        start: function (action) {
            this.init();
            this.action = action;
        },
        stop: function () {
            this.init();
            this.action = '';
        },
        test: function (position) {
            if (!this.action) return;
            if (['mouse', 'head'].indexOf(this.action) !== -1 &&
                !(this.last_time === 0 || (new Date().getTime() - this.last_time > 500 && new Date().getTime() - this.last_time < 3000))
            ) return;
            if (['eye'].indexOf(this.action) !== -1 &&
                !(this.last_time === 0 || (new Date().getTime() - this.last_time > 10))
            ) return;

            switch (this.action) {
                case 'mouse':
                    this.testMouse(position);
                    break;
                case 'head':
                    this.testHead(position);
                    break;
                case 'eye':
                    this.testEye(position);
                    break;
            }
        },
        testMouse: function (position) {
            // 左眼中心和鼻子中心的距离
            var xdiff = position[62][0] - position[27][0];
            var ydiff = position[62][1] - position[27][1];
            var dis_eye_norse = Math.pow((xdiff * xdiff + ydiff * ydiff), 0.5);

            // 上嘴唇和下嘴唇的距离
            var xdiff_mouse = position[53][0] - position[47][0];
            var ydiff_mouse = position[53][1] - position[47][1];
            var dis_mouse = Math.pow((xdiff_mouse * xdiff_mouse + ydiff_mouse * ydiff_mouse), 0.5);

            // 上次的眼鼻距离和这次的眼鼻距离差
            var dn = Math.abs(dis_eye_norse - this.last_dis_eye_norse);
            // 上次的嘴距离和本次的嘴距离差
            var dm = Math.abs(dis_mouse - this.last_dis_mouse);

            // 鼻子的位置变化不大
            if (this.last_nose_left > 0 && this.last_nose_top > 0 &&
                Math.abs(position[62][0] - this.last_nose_left) < 5 &&
                Math.abs(position[62][1] - this.last_nose_top) < 5
            ) {
                if (this.last_dis_eye_norse > 0 && dn < dis_eye_norse * 1 / 50 &&
                    this.last_dis_mouse > 0 && dm > dis_mouse / 10 &&
                    ++this.mouseCount >= this.passCount
                ) {
                    TipCtrl.setText('mouse通过');
                    this.stop();
                    FaceDetectCtrl.stop();
                }
            }

            this.last_dis_mouse = dis_mouse;
            this.last_dis_eye_norse = dis_eye_norse;
            this.last_nose_left = position[62][0];
            this.last_nose_top = position[62][1];
            this.last_time = new Date().getTime();
        },
        testHead: function (position) {
            // 左脸边缘到鼻子中心的距离
            var xdiff_left = position[62][0] - position[2][0];
            var ydiff_left = position[62][1] - position[2][1];
            var dis_left = Math.pow((xdiff_left * xdiff_left + ydiff_left * ydiff_left), 0.5);

            // 右脸边缘到鼻子中心的距离
            var xdiff_right = position[12][0] - position[62][0];
            var ydiff_right = position[12][1] - position[62][1];
            var dis_right = Math.pow((xdiff_right * xdiff_right + ydiff_right * ydiff_right), 0.5);

            // 右脸边缘到左脸边缘的距离
            var xdiff_side = position[12][0] - position[2][0];
            var ydiff_side = position[12][1] - position[2][1];
            var dis_side = Math.pow((xdiff_side * xdiff_side + ydiff_side * ydiff_side), 0.5);

            // 左脸宽度与右脸宽度的差值，用于判断非正脸，即摇头
            var dis_left_right = dis_left - dis_right;

            if (this.last_dis_left_right > 0 && dis_left_right > dis_side / 3 &&
                ++this.headCount >= this.passCount
            ) {
                TipCtrl.setText('head通过');
                this.stop();
                FaceDetectCtrl.stop();
            }

            this.last_dis_left_right = dis_left_right;
            this.last_time = new Date().getTime();
        },
        testEye: function (position) {
            // 左眼中心和鼻子中心的距离
            var xdiff1 = position[62][0] - position[27][0];
            var ydiff1 = position[62][1] - position[27][1];
            var dis_eye_norse1 = Math.pow((xdiff1 * xdiff1 + ydiff1 * ydiff1), 0.5);

            // 右眼中心和鼻子中心的距离
            var xdiff2 = position[62][0] - position[32][0];
            var ydiff2 = position[62][1] - position[32][1];
            var dis_eye_norse2 = Math.pow((xdiff2 * xdiff2 + ydiff2 * ydiff2), 0.5);

            var dis_eye_norse = (dis_eye_norse1 + dis_eye_norse2);

            // 鼻子的位置变化不大
            if (this.last_nose_left > 0 && this.last_nose_top > 0 &&
                Math.abs(position[62][0] - this.last_nose_left) < 0.5 &&
                Math.abs(position[62][1] - this.last_nose_top) < 0.5
            ) {
                if (this.last_dis_eye_norse > 0 &&
                    // TODO 眨眼阈值待界定，与眼睛大小有关
                    (Math.abs(dis_eye_norse - this.last_dis_eye_norse) > dis_eye_norse * 1 / 30) &&
                    ++this.eyeCount >= this.passCount
                ) {
                    TipCtrl.setText('eye通过');
                    this.stop();
                    FaceDetectCtrl.stop();
                }
            }

            this.last_nose_left = position[62][0];
            this.last_nose_top = position[62][1];
            this.last_dis_eye_norse = dis_eye_norse;
            this.last_time = new Date().getTime();
        },
    }

    // 提示控制器
    var TipCtrl = {
        tip: null,
        throttle: true,
        setEle: function () {
            var tip = document.createElement('span');
            tip.id = 'faceTip';

            MediaCtrl.demoWrapper.appendChild(tip);
            this.tip = document.querySelector('#faceTip');
        },
        setText: function (text) {
            var _this = this;
            if (!_this.tip) return;
            if (!_this.throttle) return;
            if (_this.tip.innerText === text || _this.tip.innerText.indexOf('通过') !== -1) return;

            _this.throttle = false;

            setTimeout(function () {
                _this.tip && (_this.tip.innerText = text);
                _this.throttle = true;
            }, 500);
        },
        removeEle: function () {
            try {
                MediaCtrl.demoWrapper.removeChild(this.tip);
                this.tip = null;
            } catch (error) { }
        },
    };

    // 人脸识别控制器
    var FaceDetectCtrl = {
        ctracker: null,
        ctrackerTimer: -1,
        passScore: 60,
        goodScore: 70,
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

            var position = this.ctracker.getCurrentPosition();
            if (position) {
                var score = Math.round(this.ctracker.getScore() * 100);
                if (score < this.passScore) {
                    TipCtrl.setText('请勿遮挡面部');
                } else {
                    this.ctracker.draw(CanvasCtrl.canvas);

                    if (score < this.goodScore) {
                        TipCtrl.setText('请保持正脸');
                    } else {
                        TipCtrl.setText(AliveDetectCtrl[AliveDetectCtrl.action + 'Tip']);
                        AliveDetectCtrl.test(position);
                    }
                }
            } else {
                TipCtrl.setText('未检测到面部');
            }
        },
        stop: function () {
            if (!this.ctracker) return;
            this.ctracker.stop();
            this.ctracker.reset();
            CanvasCtrl.ctx.clearRect(0, 0, CanvasCtrl.canvas.width, CanvasCtrl.canvas.height);
            cancelAnimationFrame(this.ctrackerTimer);
        }
    };

    aliveDetect.forEach(function (detectItem) {
        detectItem.addEventListener('click', function (e) {
            // 监听关闭按钮
            MediaCtrl.listenClose(function () {
                FaceDetectCtrl.stop();
                AliveDetectCtrl.stop();
                CanvasCtrl.removeCanvas();
                TipCtrl.removeEle();
            });
            // 监听video变化
            MediaCtrl.listenResize(function () {
                CanvasCtrl.setCanvasSize();
                FaceDetectCtrl.start();
            });
            // 调用摄像头
            MediaCtrl.start().then(function () {
                TipCtrl.setEle();
                AliveDetectCtrl.start(e.target.id);
                CanvasCtrl.setCanvas();
                CanvasCtrl.setCanvasSize();
                FaceDetectCtrl.start();
            }).catch(function (error) {
                logger('getUserMedia', error);
                TipCtrl.removeEle();
                CanvasCtrl.removeCanvas();
            })
        });
    });
})();