const connection = new RTCMultiConnection();
var MediaStream = window.MediaStream;
if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
  MediaStream = webkitMediaStream;
}
/*global MediaStream:true */
if (typeof MediaStream !== 'undefined' && !('stop' in MediaStream.prototype)) {
  MediaStream.prototype.stop = function () {
    this.getAudioTracks().forEach(function (track) {
      track.stop();
    });
    this.getVideoTracks().forEach(function (track) {
      track.stop();
    });
  };
}
window.connection = connection;
connection.bandwidth = {
  audio: 128,  // 50 kbps
  video: 1500, // 256 kbps
  screen: 2000 // 300 kbps
};
connection.dontCaptureUserMedia = true;
//connection.socketURL = 'https://mcu.myviewboard.com/' //'https://cast-sig.myviewboard.com/';
connection.socketURL = 'https://cast-sig.myviewboard.com/';
connection.socketMessageEvent = 'video-broadcast';
connection.codecs.video = 'H264';
connection.session = {
  data: true
};
export default connection;
