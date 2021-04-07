# webrtc-face-detect

## 实现
- 使用 [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) 调用摄像头、麦克风获取本地音视频流
- 使用 [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API) 录制本地音视频流
- 使用 [clmtrackr.js](https://github.com/auduno/clmtrackr) 识别人脸，通过计算识别点的位置变化实现简易的活体检测

## 体验
[https://anofury.github.io/webrtc-face-detect/index.html](https://anofury.github.io/webrtc-face-detect/index.html)
