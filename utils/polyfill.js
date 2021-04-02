window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            return window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelAnimationFrame = (function () {
    return window.cancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||
        window.mozCancelRequestAnimationFrame ||
        window.oCancelRequestAnimationFrame ||
        window.msCancelRequestAnimationFrame ||
        window.clearTimeout;
})();

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices = navigator.mediaDevices ? navigator.mediaDevices : {};
    var getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.webkitGetUserMedia;
    if (getUserMedia) {
        navigator.mediaDevices.getUserMedia = function (mediaConfig) {
            return new Promise(function (resolve, reject) {
                getUserMedia(mediaConfig, function (stream) {
                    resolve(stream);
                }, function (error) {
                    reject(error);
                });
            });
        };
    }
}