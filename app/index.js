import Rx from 'rxjs/Rx';
import {remote, desktopCapturer} from 'electron';
import connection from './utils/connection';
import peerlist from './utils/peerlist';

window.Observable = Rx.Observable;
const generatePassword = require('password-generator');
const Observable = Rx.Observable;
const request = superagent;
const net = require('net');
const socketEmitter = require('./utils/SocketEmitter');
const clients = [];
const argv = {uid: '', environment: 'stage'};
const hb = new Map();
let constraint = {};
window.desktop=constraint;
const tier = {
  cast_out_limit: -1,
  cast_in_limit: -1,
  cast_out_queue: -1,
  cast_in_queue: -1
};
const winston = require('winston');
require('winston-loggly-bulk');
const process = require('electron').remote.process;
const ipc = require('electron').ipcRenderer;
let roomid = 'local';
console.log(process.argv);
const processArgs = [];
argv.uid = '71ba9a6a-9c7a-48b1-adfd-1fee0e04ee0c';
argv.pass = generatePassword();
process.argv.forEach((item) => {
  console.log(item);
  if (item.indexOf('--userid=') !== -1) {
    argv.uid = item.slice(item.indexOf('=') + 1, item.length);
  } else {
    // ipc.send('errorInWindow', {code: 103, error: 'process userId is not defined'});
  }
  if (item.indexOf('--env=') !== -1) {
    argv.environment = item.slice(item.indexOf('=') + 1, item.length);
  } else {
    //  ipc.send('errorInWindow', {code: 103, error: 'process stage  is not defined'});
  }
});
winston.add(winston.transports.Loggly, {
  token: '9c45b61e-f16e-449b-8576-8c8493271487',
  subdomain: 'vsssicloud',
  tags: ['Cast-Module' + argv.environment],
  json: true
});

function startLog(userid = '') {
  /*window.onerror = function (error, url, line) {
    console.log(error);
    winston.log('error', error, {userid});
    ipc.send('errorInWindow', {code: 0, error});
  };
  process.on('uncaughtException', (error) => {
    console.log(error);
    winston.log('exception', error, {userid});
  });
  console.log = function () {
    this.apply(console, arguments);
    winston.log('info', arguments, {userid});
  }.bind(console.log);
  console.info = function () {
    this.apply(console, arguments);
    winston.log('info', arguments, {userid});
  }.bind(console.info);
  console.log('is log');*/
}

document.querySelector('#output').innerHTML = process.argv;
// argv.environment = 'stage';
var apiUrl = 'https://stageapi.myviewboard.com';
var signalUrl = 'https://fj07wodyp2.execute-api.us-east-1.amazonaws.com/stage/signals/';
switch (argv.environment) {
  case 'dev':
    apiUrl = 'https://devapi.myviewboard.com';
    signalUrl = 'https://fj07wodyp2.execute-api.us-east-1.amazonaws.com/stage/signals/';
    connection.socketURL = 'https://sig-stage.myviewboard.com/';
    break;
  case 'stage':
    apiUrl = 'https://stageapi.myviewboard.com';
    signalUrl = 'https://fj07wodyp2.execute-api.us-east-1.amazonaws.com/stage/signals/';
    connection.socketURL = 'https://sig-stage.myviewboard.com/';
    break;
  case 'prod':
    apiUrl = 'https://ssi.myviewboard.com';
    signalUrl = 'https://lta1a2jg8g.execute-api.us-east-1.amazonaws.com/prod/signals/';
    connection.socketURL = 'https://cast-sig.myviewboard.com/';
    break;
  default:
    break;
}
const apiKey = ''; // aes256.encrypt(Date(),argv.uid);
request.get(`${apiUrl}/api/account/${argv.uid}/role`)
  .set('X-API-Key', apiKey)
  .set('Accept', 'application/json')
  .end((err, res) => {
    if (err) {
      return ipc.send('errorInWindow', {code: 503, error: err});
    }
    connection.extra = {
      id: res.body.id,
      name: res.body.name,
      email: res.body.email
    };
    roomid = res.body.name.split(' ').join('_').toLowerCase();
    startLog(roomid);
    connection.userid = roomid;
    connection.socketCustomEvent = roomid;
    console.log(res.body.permission.name);
    res.body.permission.sub_permission.forEach((item) => {
      console.log(item);
      switch (item.name) {
        case 'Cast Out':
          tier.cast_out_limit = item.value;
          break;
        case 'Cast In':
          tier.cast_in_limit = item.value;
          break;
        case 'Cast Out Queue':
          tier.cast_out_queue = item.value;
          break;
        case 'Cast In Queue':
          tier.cast_in_queue = item.value;
          break;
      }
    });
    request.post(signalUrl).send(
      {
        host: roomid,
        endpoints: [],
        server: connection.socketURL,//'https://cast-sig.myviewboard.com/',
        connectionData: {gen: argv.pass}
      }).end(
      (err, res) => {
        if (err) {
          return winston.log('exception', err, {userid});
        }
        connection.socketURL = res.body.server;
        SignalHandShake();
      }
    );
    desktopCapturer.getSources({types: ['window', 'screen']}, (error, sources) => {
      if (error) throw error;
      console.log(connection.DetectRTC.audioOutputDevices.length > 0);
      console.log('screensource', sources);
      for (let i = 0; i < sources.length; i++) {
        if (sources[i].id === 'screen:0:0') {
          constraint = {
            audio: connection.DetectRTC.audioOutputDevices.length > 0 ? {
              mandatory: {
                chromeMediaSource: 'desktop',
              }
            } : false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
               // chromeMediaSourceId: sources[i].id,
                minWidth: 1280,
                maxWidth: 1920,
                minHeight: 720,
                maxHeight: 1080
              }
            }
          };
          navigator.webkitGetUserMedia(constraint,function(stream){console.log(stream);window.testStream=stream},function(err){console.log(err)})
          // ipc.send('initWindow', {code: 200, message: JSON.stringify(constraint)});
          // navigator.webkitGetUserMedia(constraint, gotStream, handleError);
          return;
        }
      }
    });
  });
connection.onmessage = function (event) {
  console.log('webrtcdata:', event);
};
connection.setStream = function () {
  connection.attachStreams.forEach((stream) => {
    stream.stop();
    stream = null;
  });
  connection.attachStreams = [];
  navigator.webkitGetUserMedia(constraint, gotStream, handleError);
};
connection.clearStream = function () {
  connection.attachStreams.forEach((stream) => {
    stream.stop();
    stream = null;
  });
  connection.attachStreams = [];
}
connection.sendCustomMessage = function (message) {
  if (!connection.socket) connection.connectSocket();
  console.log(message, connection.socketCustomEvent);
  connection.socket.emit(connection.socketCustomEvent, message);
};
connection.iceServers = [];
request.get('https://wt0q02pbsc.execute-api.us-east-1.amazonaws.com/prod/geticeserv').set('x-api-key', 'EEgA3n9rOW7d9OeyRP8187ZupSsaFpEzDHVBX4b0').end((err, res) => {
  if (err) {
    return ipc.send('errorInWindow', {code: 504, error: err});
  }
  res.body.forEach((item) => {
    if (item.url.indexOf('turn') !== -1) {
    }
    connection.iceServers = connection.iceServers.concat(item);
  });
});


function handleError(err) {
  console.log(err);
  constraint.audio = false;
  navigator.webkitGetUserMedia(constraint, gotStream, handleError2);
  return ipc.send('errorInWindow', {code: 401, error: err});
}

function handleError2(err) {
  console.log(err);
  return ipc.send('errorInWindow', {code: 401, error: err});
}

function gotStream(stream) {
  console.log(stream);
  connection.attachStreams = [];
  connection.addStream(stream);
  const constraints = {
    audio: true, // mandatory.
  };
  const errorCallback = function (err) {
    console.log(err);
  };
  const successCallback = function (stream) {
    console.log(stream.getAudioTracks());
    stream.getAudioTracks().forEach((item) => {
      connection.attachStreams.forEach(_stream => {
        _stream.addTrack(item);
        console.log('audio added', item);
      });
      //connection.attachStreams[0].addTrack(item)
    });
  };
  navigator.getUserMedia(constraints, successCallback, errorCallback);
}

function SignalHandShake() {
  //console.log(connection.socket.connected);
  connection.checkPresence(roomid, (isOnline, id, info) => {
    if (isOnline) {
      // throw {error: {isOnline: isOnline}};
    } else {
      connection.openOrJoin(roomid, argv.pass);
    }
    if (!connection.socket) connection.connectSocket();// .onerror((err)=>console.log(err));
    connection.socket.on(connection.socketCustomEvent, (message) => {
      // console.log(message);
      const login = message.guestInfo.name ? 'true' : 'false' || 'false';
      if (login === 'false') {
        // console.log(message)
      }
      //   console.log(message.guestInfo, login);
      if (message.messageFor === roomid) {
        hb.set(message.guestId, 5);
        if (message.action === 'dropped') {
        }
        if (message.action && message.action === 'remote') {
          //  connection.hasRmote = true;
          //  connection.setStream();
          console.log('start stream?', connection.attachStreams.length === 0)
          if (connection.attachStreams.length === 0) {
            connection.setStream();
          }
        }
        if (message.action && message.action === 'control') {
          console.log(message);
        }
        if (message.action && message.action === 'getList') {
          console.log(message);
          socketEmitter.emit('update');
        }
        if (message.action && message.action === 'setList') {
          console.log(new Map(JSON.parse(message.desear)));
          const lastlist = new Map(peerlist);
          new Map(JSON.parse(message.desear)).forEach((item, key) => {
            peerlist.set(key, item);
          });
          console.log(peerlist);
          peelistHandler(lastlist);
        }
        if (message.direction && message.direction === 'in') {
          if (message.action === 'open') {
            if (message.guestInfo.sid) {
              peerlist.forEach((item) => {
                if (item.sid === message.guestInfo.sid && item.direction === 'in') {
                  connection.sendCustomMessage({
                    messageFor: message.guestId,
                    action: 'reject',
                    hostId: roomid,
                    guestInfo: connection.extra,
                  });
                  peerlist.delete(message.guestId);
                  socketEmitter.emit('update');
                }
              });
            }
            const n_in = [...peerlist].filter((arr) => arr[1].direction === 'in').length;
            if (n_in === tier.cast_in_queue) {
              connection.sendCustomMessage({
                messageFor: message.guestId,
                action: 'exceed',
                hostId: roomid,
                guestInfo: connection.extra,
              });
              if (peerlist.get(message.guestId)) {
                peerlist.delete(message.guestId);
              }
              socketEmitter.emit('update');
              return false;
            }
          } else {
            // -----------------------------------------------------------------------------------------------//USER CASTIN START
            if (message.action === 'start') {
              console.log(message);
              const n_in = [...peerlist].filter((arr) => arr[1].direction === 'in').length;
              console.log(n_in);
              if (n_in === tier.cast_in_queue) {
                connection.sendCustomMessage({
                  messageFor: message.guestId,
                  action: 'exceed',
                  hostId: roomid,
                  guestInfo: connection.extra,
                });
                if (peerlist.get(message.guestId)) {
                  peerlist.delete(message.guestId);
                }
                socketEmitter.emit('update');
                return false;
              }
              if (!peerlist.get(message.guestId)) {
                peerlist.set(message.guestId, {
                  status: message.action,
                  approved: 'false',
                  login,
                  direction: 'in',
                  url: message.url,
                  info: message.guestInfo
                });
                peerlist.get(message.guestId).createTime = Date.now();
                if (message.guestInfo.sid) {
                  peerlist.get(message.guestId).sid = message.guestInfo.sid;
                }
                console.log(peerlist);
                connection.sendCustomMessage({
                  messageFor: message.guestId,
                  action: 'startok',
                  hostId: roomid,
                });
                if (!connection.socket) connection.connectSocket();
                connection.socket.emit(message.guestId, 'startok');
                console.log('startok');
                socketEmitter.emit('update');
              }
            }
            // -----------------------------------------------------------------------------------------------//END OF USER CASTIN START
          }
        }
        if (message.action && message.action === 'join') {
          console.log(message);
          if (message.guestInfo.sid) {
            peerlist.forEach((item) => {
              if (item.sid === message.guestInfo.sid && item.direction === 'out') {
                connection.sendCustomMessage({
                  messageFor: message.guestId,
                  action: 'reject',
                  hostId: roomid,
                  guestInfo: connection.extra,
                });
                if (peerlist.get(message.guestId)) {
                  peerlist.delete(message.guestId);
                }
              }
            });
          }
          const n_out = [...peerlist].filter((arr) => arr[1].direction === 'out').length;
          console.log(n_out);
          if (n_out === tier.cast_out_queue) {
            connection.sendCustomMessage({
              messageFor: message.guestId,
              action: 'exceed',
              hostId: roomid,
              guestInfo: connection.extra,
            });
            if (peerlist.get(message.guestId)) {
              peerlist.delete(message.guestId);
            }
            return;
          }
// -----------------------------------------------------------------------------------------------------------------------------------------------//USER JOIN
          peerlist.set(message.guestId, {
            status: 'join',
            approved: 'false',
            login,
            direction: 'out',
            info: message.guestInfo
          });
          peerlist.get(message.guestId).createTime = Date.now();
          if (message.guestInfo.sid) {
            peerlist.get(message.guestId).sid = message.guestInfo.sid;
          }
          console.log(peerlist);
          socketEmitter.emit('update');
// -----------------------------------------------------------------------------------------------------------------------------------------------//END OF USER JOIN
        }
        if (message.action && message.action === 'knock') {
          //  console.log(message);
          if (peerlist.get(message.guestId)) {
            hb.set(message.guestId, 5);
          }
        }
        if (message.action && message.action === 'mute') {
          //  console.log(message);
          if (peerlist.get(message.guestId)) {
            peerlist.get(message.guestId).info.paused = true;
            hb.set(message.guestId, 5);
          }
          socketEmitter.emit('update');
        }
        if (message.action && message.action === 'unmute') {
          //  console.log(message);
          if (peerlist.get(message.guestId)) {
            peerlist.get(message.guestId).info.paused = false;
            hb.set(message.guestId, 5);
          }
          socketEmitter.emit('update');
        }
        if (message.action && message.action === 'stopped') {
          console.log(message);
          if (peerlist.get(message.guestId)) {
            peerlist.get(message.guestId).status = 'stop;';
          }
          socketEmitter.emit('update');
        }
        if (message.action && message.action === 'delete') {
          peerlist.delete(message.guestId);
          socketEmitter.emit('update');
        }
      }
    });
    //  connection.openOrJoin(roomid, argv.pass);
    /*   setTimeout(() => {
     connection.becomePublicModerator('viewsonic');
     }, 1000); */
  });
  // ipc.send('initWindow', {code: 200, message: 'tcpstart'});
  console.log('ipc:200');
  ipc.send('initWindow', {code: 200, error: null});
}

tcp_start();

function tcp_start() {
  const tcp = net.createServer((socket) => {
    socket.setNoDelay();
    socket.name = `${socket.remoteAddress}:${socket.remotePort}`;
    socket.on('data', (data) => {
      // socket.write(roomid);
      console.log(data);
      if (socket.remoteAddress !== '::ffff:127.0.0.1') {
        // return;
      }
      tcpInHandler(data, socket);
    });
    if (socket.remoteAddress !== '::ffff:127.0.0.1') {
      // return;
    }
    // Put this new client in the list
    clients.push(socket);
    window.clients = clients;
    // writeSocket(socket);
    socketEmitter.emit('update');
    // Remove the client from the list when it leaves
    socket.on('end', () => {
      clients.splice(clients.indexOf(socket), 1);
    });
  }).listen(25552);
}

socketEmitter.on('update', (data) => {
  clients.forEach((socket) => {
    writeSocket(socket);
  });
  connection.sendCustomMessage({
    messageFor: connection.socketCustomEvent,
    action: 'control',
    hostId: roomid,
    guestInfo: JSON.stringify([...peerlist])
  });
});

function writeSocket(socket) {
  console.log(peerlist);
  const obj = [];
  peerlist.forEach((item, key) => {
    // console.log(item);
    if (item) {
      if (key.indexOf('^') != -1) {
        item.user = key.split('^')[0];
        item.id = key.split('^')[1];
      }
      obj.push(item);
    }
  });
  try {
    socket.write(JSON.stringify(obj));
    console.log(obj);
  } catch (err) {
    clients.splice(clients.indexOf(socket), 1);
  }
}

function addAudio() {
  const constraints = {
    audio: true, // mandatory.
  };
  const errorCallback = function (err) {
    console.log(err);
  };
  const successCallback = function (stream) {
    console.log(stream.getAudioTracks());
    stream.getAudioTracks().forEach((item) => {
      connection.attachStreams[0].addTrack(item);
      console.log('audio added', item);
    });
  };
  navigator.getUserMedia(constraints, successCallback, errorCallback);
}

function tcpInHandler(data, socket) {
  console.log('frank says:', data.toString());
  if (data === 'ok') {
  } else if (data === 'refresh') {
    connection.getAllParticipants().forEach((item) => {
      //  peerlist.set(item, {status: 'play', approved: 'true'})
      peerlist.get(item).status = 'play;';
      peerlist.get(item).approved = 'true';
    });
    // socket.write(JSON.stringify([...peerlist]));
    writeSocket(socket);
  } else {
    const lastlist = new Map(peerlist);
    const dataobj = JSON.parse(data.toString().trim());
    dataobj.forEach((item, key) => {
      const user = `${item.user}^${item.id}`;
      delete item.user;
      peerlist.set(user, item);
    });
    peelistHandler(lastlist);
  }
  socketEmitter.emit('update');
}

function peelistHandler(lastlist) {
  lastlist.forEach((item, key) => {
    if (peerlist.get(key)) {
      if (item.sid) {
        peerlist.get(key).sid = item.sid;
      }
      if (item.info) {
        peerlist.get(key).info = item.info;
      }
      if (item.status === peerlist.get(key).status) {
        console.log(item, 'unchanged');
      } else {
        console.log('changed', item);
        if (peerlist.get(key).status === 'play') {
          console.log(connection);
          connection.sendCustomMessage({
            messageFor: key,
            action: 'play',
            hostId: roomid,
            password: argv.pass,
            guestInfo: connection.extra,
          });
        }
        if (peerlist.get(key).status === 'stop') {
          connection.sendCustomMessage({
            messageFor: key,
            action: 'stop',
            hostId: roomid,
            password: argv.pass,
            guestInfo: connection.extra,
          });
        }
        console.log(socketEmitter);
        socketEmitter.emit('update');
      }
    }
  });
  /* if theres no playing peer clear stream and add stream until least one playing*/


  /* if([...peerlist].filter(peer => peer[1].direction === 'out' && peer[1].status === 'play').length === 0 ){
   connection.setStream();
   }*/
}

setInterval(() => {
  peerlist.forEach((item, key) => {
    connection.checkPresence(key, (isRoomExist, peerKey) => {
      if (!isRoomExist) {
        peerlist.delete(peerKey);
        socketEmitter.emit('update');
      }
    });
  });
  if ([...peerlist].filter(peer => peer[1].direction === 'out').length === 0) {
    if (connection.peers.getAllParticipants().length === 0 && connection.attachStreams.length > 0) {
      console.log('clear stream1', peerlist, connection.peers.getAllParticipants().length)
      connection.clearStream();
    }
  } else if (connection.attachStreams.length === 0) {
    connection.setStream();
  }

}, 2000);

connection.onUserStatusChanged = function (event) {
  /* console.log('statuschange', event);
   if (event.status === 'offline' && connection.peers.getAllParticipants().length === 0) {
   connection.clearStream();
   }
   console.log(connection.peers.getAllParticipants().length, connection.attachStreams)
   if (event.status === 'online' && connection.peers.getAllParticipants().length > 0 && connection.attachStreams.length === 0) {
   connection.setStream();
   }*/
  // winston.log('info', event, {userid: userid});

};

