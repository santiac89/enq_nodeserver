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

  client_socket = net.createConnection(client_port, rinfo.address, function() {
    this.write(response, 'UTF-8', (err) => { this.end(); });
  });

  client_socket.on('timeout', () => { client_socket.end(); });
  client_socket.on('error' , (err) => { client_socket.end(); });

});

client.on("error", function(err) { console.log(err); });
client.on("timeout", function() { console.log("Timeout"); });
