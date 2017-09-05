/*
 import React from 'react';
 import { render } from 'react-dom';
 import { AppContainer } from 'react-hot-loader';
 import Root from './containers/Root';
 import { configureStore, history } from './store/configureStore';
 import './app.global.css';

 const store = configureStore();

 render(
 <AppContainer>
 <Root store={store} history={history} />
 </AppContainer>,
 document.getElementById('root')
 );

 if (module.hot) {
 module.hot.accept('./containers/Root', () => {
 const NextRoot = require('./containers/Root'); // eslint-disable-line global-require
 render(
 <AppContainer>
 <NextRoot store={store} history={history} />
 </AppContainer>,
 document.getElementById('root')
 );
 });
 }
 */


var roomid="local"
const hb = new Map();
var localStream;

console.log(process.argv);
var processArgs=[];
process.argv.forEach(function (item) {
  if(item.indexOf('--js-flags')!=-1){
    var flags=item.slice(item.indexOf('=')+1,item.length);
    processArgs=flags.split('&')
  }
});
console.log(processArgs);
import { remote, desktopCapturer} from 'electron';


function handleError (e) {
  console.log(e)
}

const connection = new RTCMultiConnection();
window.connection=connection;



connection.bandwidth = {
  audio: 128,  // 50 kbps
  video: 1500, // 256 kbps
  screen: 2000 // 300 kbps
};

connection.session = {
  audio: true,
  screen: true,
  oneway: true
};
connection.dontCaptureUserMedia = true;
connection.socketURL = 'https://cast.myviewboard.com/';
connection.socketMessageEvent = 'video-broadcast';
connection.codecs.video = 'H264';
console.log(connection);
connection.userid=roomid;
connection.socketCustomEvent = roomid;



desktopCapturer.getSources({types: ['window', 'screen']}, (error, sources) => {
  if (error) throw error
  console.log(sources);
  for (let i = 0; i < sources.length; ++i) {
    if (sources[i].name === 'Entire screen') {
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
      }, gotStream, handleError)
      return;
    }
  }
});

var peerlist=new Map();

function gotStream(stream) {

  console.log(stream);

  localStream=stream;
  connection.addStream(stream);

  connection.checkPresence(roomid, function (isOnline, id, info) {
    if (!connection.socket) connection.connectSocket();
    connection.socket.on(connection.socketCustomEvent, function (message) {
      if(message.guestInfo.name){}
      var login=message.guestInfo.name?'true':'false'

      if (message.messageFor == roomid) {
        hb.set(message.guestId, 5);

        if(message.action=='dropped'){

        }
        //      console.log(message);
        if(message.direction=='in'){
          if(message.action=='open'){
            if(message.guestInfo.sid){
              peerlist.forEach(function (item,key) {
                if(item.sid==message.guestInfo.sid && item.direction=='in'){
                  connection.sendCustomMessage({
                    messageFor: message.guestId,
                    action: 'reject',
                    hostId: roomid,
                    guestInfo: connection.extra,
                  })
                  peerlist.delete(message.guestId);
                  socketEmitter.emit('update')
                  return;
                }
              });
            }
            let n_in=[...peerlist].filter(function(arr){return arr[1].direction=='in'}).length;

            console.log(n_in);

            if(n_in===tier.cast_in_queue){
              connection.sendCustomMessage({
                messageFor: message.guestId,
                action: 'exceed',
                hostId: roomid,
                guestInfo: connection.extra,
              })
              if(peerlist.get(message.guestId)){
                peerlist.delete(message.guestId);
              }
              socketEmitter.emit('update')
              return false;
            }

          }else{
            //-----------------------------------------------------------------------------------------------//USER CASTIN START

            if(message.action==="start"){
              let n_in=[...peerlist].filter(function(arr){return arr[1].direction=='in'}).length;
              console.log(n_in);
              if(n_in===tier.cast_in_queue){
                connection.sendCustomMessage({
                  messageFor: message.guestId,
                  action: 'exceed',
                  hostId: roomid,
                  guestInfo: connection.extra,
                })
                if(peerlist.get(message.guestId)){
                  peerlist.delete(message.guestId);
                }
                socketEmitter.emit('update')
                return false;
              }
            }

            peerlist.set(message.guestId, {status: message.action, approved: 'false',login:login,direction:'in',url:message.url});

            peerlist.get(message.guestId).createTime=Date.now();
            if(message.guestInfo.sid){
              peerlist.get(message.guestId).sid=message.guestInfo.sid;
            }
            console.log(peerlist);
            socketEmitter.emit('update');
            //-----------------------------------------------------------------------------------------------//USER CASTIN START
          }

          // if(message.action=='start'){
          //
          //
          // }

        }
        if (message.action == 'join') {
          console.log(message);
          if(message.guestInfo.sid){
            peerlist.forEach(function (item,key) {
              if(item.sid==message.guestInfo.sid && item.direction=='out'){
                connection.sendCustomMessage({
                  messageFor: message.guestId,
                  action: 'reject',
                  hostId: roomid,
                  guestInfo: connection.extra,
                })
                if(peerlist.get(message.guestId)){
                  peerlist.delete(message.guestId);
                }
                return;
              }
            });
          }

          let n_out=[...peerlist].filter(function(arr){return arr[1].direction=='out'}).length;

          console.log(n_out);

          if(n_out===tier.cast_out_queue){
            connection.sendCustomMessage({
              messageFor: message.guestId,
              action: 'exceed',
              hostId: roomid,
              guestInfo: connection.extra,
            })
            if(peerlist.get(message.guestId)){
              peerlist.delete(message.guestId);
            }
            return;
          }


//-----------------------------------------------------------------------------------------------------------------------------------------------//USER JOIN
          peerlist.set(message.guestId, {status: 'join', approved: 'false',login:login,direction:'out'});
          peerlist.get(message.guestId).createTime=Date.now();
          if(message.guestInfo.sid){
            peerlist.get(message.guestId).sid=message.guestInfo.sid;
          }

          console.log(peerlist)
          socketEmitter.emit('update')


//-----------------------------------------------------------------------------------------------------------------------------------------------//USER JOIN

        }
        if (message.action == 'knock') {
          //  console.log(message);
          if (peerlist.get(message.guestId)) {
            hb.set(message.guestId, 5);
          }
        }
        if (message.action == 'stopped') {
          console.log(message);
          if( peerlist.get(message.guestId)){
            peerlist.get(message.guestId).status='stop;';
          }
          socketEmitter.emit('update');
        }

        if (message.action == 'delete') {
          peerlist.delete(message.guestId);
          socketEmitter.emit('update')
        }
      }
    })

    connection.openOrJoin(roomid, 'password');

    setTimeout(function () {
      //connection.becomePublicModerator('viewsonic');
    },1000)

  });
}

connection.onstream = function (event) {
  //connection.attachStreams = [localStream];
  //connection.videosContainer.appendChild(event.mediaElement);
  //  event.mediaElement.play();
  setTimeout(function () {
    // event.mediaElement.play();
  }, 5000);
};

