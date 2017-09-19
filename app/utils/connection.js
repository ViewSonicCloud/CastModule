const connection = new RTCMultiConnection();
window.connection = connection;
connection.bandwidth = {
  audio: 128,  // 50 kbps
  video: 1500, // 256 kbps
  screen: 2000 // 300 kbps
};


connection.dontCaptureUserMedia = true;
connection.socketURL = 'https://cast-sig.myviewboard.com/';
connection.socketMessageEvent = 'video-broadcast';
connection.codecs.video = 'H264';


export default connection;
