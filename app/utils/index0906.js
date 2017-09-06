console.log(process.argv);
var processArgs=[];
process.argv.forEach(function (item) {
  if(item.indexOf('--js-flags')!=-1){
    var flags=item.slice(item.indexOf('=')+1,item.length);
    processArgs=flags.split('&')
  }
});

console.log(processArgs);



import { remote,desktopCapturer} from 'electron';
var connection = new RTCMultiConnection();
var localStream;
var source;

function handleError (e) {
  console.log(e)
}


connection.iceServers = [];

// last step, set TURN url (recommended)
connection.iceServers.push(
  {url:'stun:stun.l.google.com:19302'},
  {url:'stun:stun1.l.google.com:19302'},
  {url:'stun:stun2.l.google.com:19302'},
  {url:'stun:stun3.l.google.com:19302'},
  {url:'stun:stun4.l.google.com:19302'},
  {
    urls: 'stun://numb.viagenie.ca',
    credential: 'kemchep',
    username: 'zeichenjoyce@gmail.com'
  });


window.connection=connection;
connection.dontCaptureUserMedia = true;
//connection.dontCaptureUserMedia = false;
//connection.dontCaptureUserMedia = true
//connection.dontAttachStream=true;

//connection.codecs.video = 'VP8';

connection.bandwidth = {
  audio: 128,  // 50 kbps
  video: 1500, // 256 kbps
  screen: 1500 // 300 kbps
};
connection.codecs.video = 'H264';
// by default, socket.io server is assumed to be deployed on your own URL
connection.socketURL = 'https://cast.myviewboard.com/';

connection.socketMessageEvent = 'video-broadcast';
connection.session = {
  screen: true,
  oneway: true
};


connection.onstream = function(event) {
  console.log('onstream',connection.attachStreams);
};

// ......................................................
// ......................Handling Room-ID................
// ......................................................
var roomid = 'local';

if(processArgs.length>0){
 // roomid=processArgs[0].slice(processArgs[0].lastIndexOf("=")+1,processArgs[0].length);
}

if(roomid && roomid.length) {

  localStorage.setItem(connection.socketMessageEvent, roomid);
  // auto-join-room
  (function reCheckRoomPresence() {
    connection.checkPresence(roomid, function(isRoomExists) {
      if(isRoomExists) {
        connection.join(roomid);
        return;
      }
      setTimeout(reCheckRoomPresence, 5000);
    });
  })();
}


desktopCapturer.getSources({types: ['window', 'screen']}, (error, sources) => {
  if (error) throw error
  console.log(sources);
  for (let i = 0; i < sources.length; ++i) {
    if (sources[i].name === 'Entire screen') {
      source=sources[i];
      console.log(sources[i])
      navigator.webkitGetUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sources[i].id,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720
          }
        }
      }, function (stream) {
        localStream=stream;
        connection.addStream(stream);
        if(connection.attachExternalStream){
          //connection.attachExternalStream(stream,true);
        }
        connection.sdpConstraints.mandatory = {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false
        };
        connection.open(roomid, function() {

        });
        console.log('desktopCapturer',stream);


      }, handleError)
      return
    }
  }
});


