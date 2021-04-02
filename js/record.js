(function () {
    var startRecordBtn = document.querySelector('#startRecord');

    var durationZfill = function (duration = 0) {
        var hours = Math.floor(duration / 60 / 60);
        var minute = Math.floor((duration - hours * 60 * 60) / 60);
        var second = Math.floor(duration - hours * 60 * 60 - minute * 60);
        var zfill = function (num) {
            return (num < 10 ? '0' : '') + num;
        };

        return zfill(hours) + ':' + zfill(minute) + ':' + zfill(second);
    };

    // 录制按钮UI控制器
    var RecordUICtrl = {
        isRecording: false,
        recordBtn: null,
        downloadBtn: null,
        durationText: null,
        cb: null,
        setRecordBtn: function () {
            var _this = this;

            var recordBtn = document.createElement('button');
            recordBtn.id = 'webrtcRecord';
            recordBtn.disabled = 'disabled';
            recordBtn.addEventListener('click', function () {
                if (_this.isRecording) {
                    _this.stop();
                } else {
                    _this.start();
                }
            });

            MediaCtrl.demoWrapper.appendChild(recordBtn);

            _this.recordBtn = document.querySelector('#webrtcRecord');
        },
        setDownloadBtn: function (innerText, cb) {
            var _this = this;

            var downloadBtn = document.createElement('button');
            downloadBtn.id = 'webrtcDownload';
            downloadBtn.innerText = innerText;
            downloadBtn.addEventListener('click', function () {
                cb && cb();
            });

            MediaCtrl.demoWrapper.appendChild(downloadBtn);

            _this.downloadBtn = document.querySelector('#webrtcDownload');
        },
        setDurationVal: function (duration) {
            this.durationText.innerText = durationZfill(duration);
        },
        setDurationText: function () {
            var durationText = document.createElement('span');
            durationText.id = 'webrtcDuration';
            durationText.innerText = durationZfill();

            MediaCtrl.demoWrapper.appendChild(durationText);

            this.durationText = document.querySelector('#webrtcDuration');
        },
        removeRecordBtn: function () {
            try {
                // 录制过程点击关闭
                this.isRecording && this.stop();
                this.removeDownloadBtn();
                MediaCtrl.demoWrapper.removeChild(this.recordBtn);
                MediaCtrl.demoWrapper.removeChild(this.durationText);
                this.recordBtn = this.durationText = this.downloadBtn = null;
            } catch (error) { }
        },
        removeDownloadBtn: function () {
            try {
                MediaCtrl.demoWrapper.removeChild(this.downloadBtn);
            } catch (error) { }
        },
        start: function () {
            this.isRecording = true;
            this.recordBtn.className = 'recording';
            this.removeDownloadBtn();
            this.cb && this.cb(true);
        },
        stop: function () {
            this.isRecording = false;
            this.recordBtn.className = '';
            this.cb && this.cb(false);
        },
        listenStatus: function (cb) {
            this.recordBtn.disabled = '';
            this.cb = cb;
        }
    };

    // 录制功能控制器
    var RecordActCtrl = {
        blob: null,
        recoder: null,
        startTimer: -1,
        start: function (stream) {
            var _this = this;
            var recodedBuffer = [];
            var options = {
                mimeType: 'video/webm;codecs=vp9'
            };

            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                alert(options.mimeType + 'is not supported');
                return;
            }

            try {
                _this.recoder = new MediaRecorder(stream, options);
                _this.recoder.ondataavailable = function (e) {
                    recodedBuffer.push(e.data);
                    logger('ondataavailable', '录制数据有效', e.data);
                }

                _this.recoder.onstart = function () {
                    logger('mediaRecoder', '开始录制音视频');

                    var startTime = new Date();
                    RecordUICtrl.setDurationVal((new Date() - startTime) / 1000);
                    _this.startTimer = setInterval(function () {
                        RecordUICtrl.setDurationVal((new Date() - startTime) / 1000);
                    }, 500);
                }

                _this.recoder.onstop = function () {
                    logger('stopRecord', '结束录制音视频');

                    clearInterval(_this.startTimer);
                    _this.blob = new Blob(recodedBuffer, { type: 'video/webm;codecs=vp9' });

                    logger('mediaRecoder', '录制结果', _this.blob);

                    RecordUICtrl.setDownloadBtn('下载 ' + (_this.blob.size / 1024 / 1024).toFixed(2) + 'MB', function () {
                        _this.download(_this.blob)
                    });
                }

                _this.recoder.onerror = function (error) {
                    logger('mediaRecoder', error);
                }

                _this.recoder.start();
            } catch (error) {
                logger('mediaRecoder', error);
                return;
            }
        },
        stop: function () {
            this.recoder.stop();
        },
        download: function (blob) {
            var url = window.URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.style.display = 'none';
            link.download = 'record-result.mp4';
            link.click();
        },
    };

    startRecordBtn.addEventListener('click', function () {
        // 设置录制按钮
        RecordUICtrl.setRecordBtn();
        // 监听关闭按钮
        MediaCtrl.listenClose(function () {
            RecordUICtrl.removeRecordBtn();
        });
        // 调用摄像头
        MediaCtrl.start().then(function () {
            // 监听录制按钮
            RecordUICtrl.listenStatus(function (status) {
                if (status) {
                    // 点击开始录制
                    RecordActCtrl.start(MediaCtrl.stream);
                } else {
                    // 点击停止录制
                    RecordActCtrl.stop();
                }
            });
            RecordUICtrl.setDurationText();
        }).catch(function (error) {
            logger('getUserMedia', error);

            RecordUICtrl.removeRecordBtn();
        })
    });
})();