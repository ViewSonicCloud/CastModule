/* eslint global-require: 1, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import {app, BrowserWindow} from 'electron';
import Rx from 'rxjs/Rx';
import MenuBuilder from './menu';
const net = require('net');
var ipc = require('electron').ipcMain;
const log_clients = [];
var socketqueue = [];
ipc.on('initWindow', function (event, data) {
  console.log(JSON.stringify(data));
  log_clients.forEach((log_client) => {
    log_client.write(JSON.stringify(data) + '\n\n');
  });
});
ipc.on('errorInWindow', function (event, data) {
  console.log(event, data);
  console.log(JSON.stringify(data));
  let logMsg = ''
  /*  logMsg += "LogStart"
   logMsg += '\n*************************************\n'
   logMsg += '\n-----------------------------------------------------\n';*/
  /* logMsg += '\n' + 'LogTime=' + new Date() + '\n';
   logMsg += '\n-----------------------------------------------------\n';*/
  logMsg += JSON.stringify(data) + '\n\n';
  /*  logMsg += '\n*************************************\n';
   logMsg += "LogEnd"*/
  log_clients.forEach((log_client) => {
    log_client.write(logMsg);
  });
});
let mainWindow = null;
if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}
if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}
/*const installExtensions = async () => {
 const installer = require('electron-devtools-installer');
 const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
 const extensions = [
 'REACT_DEVELOPER_TOOLS',
 'REDUX_DEVTOOLS'
 ];
 return Promise
 .all(extensions.map(name => installer.default(installer[name], forceDownload)))
 .catch(console.log);
 };*/
/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development') {
    mainWindow = new BrowserWindow({
                                     show: false,
                                     width: 1024,
                                     height: 728
                                   });
  } else {
    mainWindow = new BrowserWindow({
                                     show: false,
                                     width: 1024,
                                     height: 728
                                   });
  }
  //mainWindow.openDevTools();

  const log_tcp = net.createServer((socket) => {
    socket.name = `${socket.remoteAddress}:${socket.remotePort}`;
    socket.setNoDelay();
    socket.on('data', (data) => {
                console.log(socket.remoteAddress)
                console.log(data.toString());
                if (socket.remoteAddress !== '::ffff:127.0.0.1') {
                  // return;
                }
                console.log(data.toString());
                if (data && data.toString() === "start") {
                  mainWindow.loadURL(`file://${__dirname}/app.html`);
                }
              }
    );
    if (socket.remoteAddress !== '::ffff:127.0.0.1') {
      // return;
    }
    log_clients.push(socket);
    // Remove the client from the list when it leaves
    socket.on('end', () => {
      log_clients.splice(log_clients.indexOf(socket), 1);
    });
  }).listen(25551);
  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    //mainWindow.show();
    //mainWindow.focus();
    windowInit();
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  //const menuBuilder = new MenuBuilder(mainWindow);
  //menuBuilder.buildMenu();
});
function windowInit() {};
var exec = require('child_process').exec;
var cmd = exec('tasklist |find /i "vBoard.exe" ');
var ipcs = [];
Rx.Observable.interval(5000).subscribe({next: (value) => {
                                           var isvblive = '';
                                           cmd = exec('tasklist |find /i "vBoard.exe" ');
                                           cmd.stdout.on('data', function (data) {
                                             isvblive += data;
                                           });
                                           cmd.on('exit', function (code) {
                                             if (isvblive.indexOf('vBoard.exe') === -1) {
                                               if (process.env.NODE_ENV !== 'development') {
                                                 // app.quit();
                                               }
                                             }
                                           });
                                         },
                                       });
/*
 function writeSocket(socket,data) {
 return new Promise((resolve,err)=>{
 socket.write(JSON.stringify(data)+'\n');
 setTimeout(()=> {
 resolve();
 },100);
 });
 }

 function exec() {
 if(socketqueue.length>0){
 let obj=socketqueue.shift();
 obj.func.apply(this,obj.params).then(function (...args) {
 setTimeout(exec,10)
 },function(err){
 console.log(err);
 })
 }else{
 setTimeout(exec,10)
 }
 }
 */
