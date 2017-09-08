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

window.alert(process.argv);
import { remote, desktopCapturer} from 'electron';
import connection from './utils/connection';
import peerlist from './utils/peerlist';
const request=superagent;
const net = require('net');
const EventEmitter = require('events');
const socketEmitter = new EventEmitter();
const clients=[];
const argv={uid:'',environment:'prod'}
let hb=new Map();
let tier={
  cast_out_limit:-1,
  cast_in_limit:-1,
  cast_out_queue:-1,
  cast_in_queue:-1
}
console.log(peerlist);


var roomid="local"


console.log(process.argv);
var processArgs=[];

process.argv.forEach(function (item) {
  console.log(item);
  if(item.indexOf('--js-flags')!=-1){
    var flags=item.slice(item.indexOf('=')+1,item.length);
    processArgs=flags.split('&')
  }
});



document.querySelector('#output').innerHTML = process.argv;

var apiUrl='https://ssi.myviewboard.com';
switch (argv.environment){
  case 'dev':
    apiUrl='https://devapi.myviewboard.com';
    break;
  case 'stage':
    apiUrl='https://stageapi.myviewboard.com';
    break;
  case 'prod':
    apiUrl='https://ssi.myviewboard.com';
    break;
}
argv.uid="71ba9a6a-9c7a-48b1-adfd-1fee0e04ee0c";
var apiKey='';//aes256.encrypt(Date(),argv.uid);

request.get(apiUrl+'/api/account/'+argv.uid+'/role')
  .set('X-API-Key',apiKey)
  .set('Accept', 'application/json')
  .end(function (err, res) {
    console.log(res.body.permission.name)
    res.body.permission.sub_permission.forEach(function (item) {
      console.log(item)
      switch (item.name){
        case "Cast Out":
          tier.cast_out_limit=item.value;
          break;
        case "Cast In":
          tier.cast_in_limit=item.value;
          break;
        case "Cast Out Queue":
          tier.cast_out_queue=item.value;
          break;
        case "Cast In Queue":
          tier.cast_in_queue=item.value;
          break;
      }
    })
  });



console.log(processArgs);

console.log(connection);
connection.userid=roomid;
connection.socketCustomEvent = roomid;


connection.iceServers = [];

request.get('https://cast.myviewboard.com/api/ice').end(function (err, res) {
  connection.iceServers=connection.iceServers.concat(res.body);
});


request.get('https://wt0q02pbsc.execute-api.us-east-1.amazonaws.com/prod/geticeserv').set('x-api-key','EEgA3n9rOW7d9OeyRP8187ZupSsaFpEzDHVBX4b0').end(function (err, res) {
  res.body.forEach(function (item) {
    if(item.url.indexOf('turn')!==-1){
      connection.iceServers=connection.iceServers.concat(item);
    }
  })
});


function handleError (e) {
  console.log(e)
}


desktopCapturer.getSources({types: ['window', 'screen']}, (error, sources) => {
  if (error) throw error

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


function gotStream(stream) {
  console.log(stream);
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
      connection.becomePublicModerator('viewsonic');
    },1000)

  });

  tcp_start();
}

connection.onstream = function (event) {

};


function tcp_start(){
  const tcp = net.createServer(function (socket) {
    socket.name = socket.remoteAddress + ":" + socket.remotePort;
    socket.on('data', function (data) {
      // socket.write(roomid);
      console.log(data);

      if (socket.remoteAddress != '::ffff:127.0.0.1') {
        return;
      }
      tcpInHandler(data, socket);
    });
    if (socket.remoteAddress != '::ffff:127.0.0.1') {
      return;
    }

    // Put this new client in the list
    clients.push(socket);
    window.clients = clients;
    writeSocket(socket);

    // Remove the client from the list when it leaves
    socket.on('end', function () {
      clients.splice(clients.indexOf(socket), 1);
    });

  }).listen(25552);
}

function writeSocket(socket) {

  console.log(peerlist)
  let obj = [];
  peerlist.forEach(function (item, key) {
    //console.log(item);
    if(item){
      if(key.indexOf('^')!=-1){
        item.user=key.split('^')[0];
        item.id=key.split('^')[1];
      }
      obj.push(item);
    }
  });

  try {
    socket.write(JSON.stringify(obj));
    console.log(obj)
  } catch (err) {

    clients.splice(clients.indexOf(socket), 1);
  }

}

function tcpInHandler(data,socket) {
  console.log('frank says:',data.toString());
  if(data=='ok'){
  }else if (data == 'refresh') {
    connection.getAllParticipants().forEach(function (item) {
      //  peerlist.set(item, {status: 'play', approved: 'true'})
      peerlist.get(item).status='play;';
      peerlist.get(item).approved='true';
    })

    //socket.write(JSON.stringify([...peerlist]));
    writeSocket(socket);
  }else{


    var lastlist=new Map(peerlist);
    window.console.log(lastlist);

    let dataobj = JSON.parse(data.toString().trim());
    window.console.log(typeof dataobj,dataobj);

    dataobj.forEach(function (item, key) {
      let user = item.user+'^'+item.id;
      delete item.user;
      peerlist.set(user, item);
    });
    console.log(peerlist);

    lastlist.forEach(function (item,key) {

      if(peerlist.get(key)){

        if(item.sid){
          peerlist.get(key).sid=item.sid;
        }

        if(item.status===peerlist.get(key).status){
          console.log(item,'unchanged')
        }else{
          console.log('changed',item);
          if(peerlist.get(key).status==="play"){
            connection.sendCustomMessage({
              messageFor: key,
              action: 'play',
              hostId: roomid,
              password: 'password',
              guestInfo: connection.extra,
            })
          }
          if(peerlist.get(key).status==="stop"){
            connection.sendCustomMessage({
              messageFor: key,
              action: 'stop',
              hostId: roomid,
              password: 'password',
              guestInfo: connection.extra,
            })
          }
        }
      }
    })
  }
  socketEmitter.emit('update');
}

function socketInHandler(data,socket) {
  console.log('frank says:',data.toString());
  if(data=='ok'){
  }else if (data == 'refresh') {
    connection.getAllParticipants().forEach(function (item) {
      //  peerlist.set(item, {status: 'play', approved: 'true'})
      peerlist.get(item).status='play;';
      peerlist.get(item).approved='true';
    })

    //socket.write(JSON.stringify([...peerlist]));
    writeSocket(socket);
  }
  else{


    var lastlist=new Map(window.peerlist);
    window.console.log(lastlist);
    let dataobj = JSON.parse(data.toString().trim());

    if(dataobj.selectAudioSource){


      return;
    }



    window.console.log(typeof dataobj,dataobj);
    dataobj.forEach(function (item, key) {
      console.log(item);
      peerlist.set(item[0],item[1]);
    });

    window.console.log(peerlist);
    window.console.log(lastlist);

    lastlist.forEach(function (item,key) {
      if(peerlist.get(key)){
        if(item.status===peerlist.get(key).status){
          console.log(item,'unchanged')
        }else{
          console.log('changed',item);
          if(peerlist.get(key).status==="play"){
            window.console.log(connection);
            window.connection.sendCustomMessage({
              messageFor: key,
              action: 'play',
              hostId: roomid,
              password: 'password',
              guestInfo: connection.extra,
            })
          }
          if(peerlist.get(key).status==="stop"){
            window.connection.sendCustomMessage({
              messageFor: key,
              action: 'stop',
              hostId: roomid,
              password: 'password',
              guestInfo: connection.extra,
            })
          }
        }
      }
    })
  }
  window.peerlist=peerlist;
  socketEmitter.emit('update');
}


setInterval(function () {
  hb.forEach(function (item, key) {
    item = item-- <= 0 ? 0 : item--;
    hb.set(key, item);
  })
  peerlist.forEach(function (item, key) {
    if (hb.get(key) === 0) {
      connection.getAllParticipants().forEach(function (item) {
        if(key===item){
          return false;
        }
      });
      peerlist.delete(key);
      hb.delete(key);
      console.log(key,'is kicked');
      //   window.peerlist=peerlist
      socketEmitter.emit('update');
    }
  })

  connection.getAllParticipants().forEach(function (item) {
    if(peerlist.get(item)){

    }else{
      connection.sendCustomMessage({
        messageFor: item,
        action: 'stop',
        hostId: roomid,
        guestInfo: connection.extra,
      })
      connection.sendCustomMessage({
        messageFor:item,
        action: 'dropped',
        hostId: roomid,
        guestInfo: connection.extra,
      })
      //connection.close(item);
    }
  })

//console.log(hb);
  window.hb=hb;
}, 2000);


setInterval(()=> {
  console.log(peerlist);
  peerlist.forEach(function (item, key) {
    if(hb.get(key)===undefined){
      peerlist.delete(key);
      //  window.peerlist=peerlist;
      socketEmitter.emit('update');
    };
  })
},5000);

