var dgram = require('dgram');
var client = dgram.createSocket("udp4");
var config = require('../config.js');
var network = require('../util/network');
var net = require('net');

var broadcast_address = network.broadcast();
var broadcast_port = config.service_discovery.broadcast_listen_port;
var client_port = config.service_discovery.client_announce_port;

var service_info = {
  address: network.address(),
  port: process.argv[2],
  name: config.server_name,
  reenqueue_limit: config.reenqueue_limit,
  call_timeout: (config.call_timeout * 1000)
};

client.bind(broadcast_port, broadcast_address);

client.on("listening", function () {
  console.log("Waiting for client query on "+broadcast_address+":"+broadcast_port);
  client.setBroadcast(true);
});

client.on("message", function(message, rinfo) {

  if (message.toString() != "whereareyou?") return;

  var response = new Buffer(JSON.stringify(service_info) + "\n");

  net.createConnection(client_port, rinfo.address, function() {

    var socket = this;

    this.on('timeout', function() {
      socket.end();
    });

    this.on('error' ,function() {
      socket.end();
    });

    this.write(response, 'UTF-8', function(err) { socket.end(); });
  });

});
