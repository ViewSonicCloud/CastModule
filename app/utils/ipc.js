var ipc={
  tcp_start:function () {
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

}

export default ipc;
