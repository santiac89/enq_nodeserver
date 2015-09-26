var dgram = require('dgram');
var client = dgram.createSocket("udp4");
var config = require('../config.js');
var network = require('../util/network');

var broadcast_address = network.broadcast();
var broadcast_port = config.broadcast_port;

var service_info = {
  address: network.address(),
  port: process.argv[2],
  name: config.server_name,
  reenqueue_limit: config.reenqueue_limit,
  call_timeout: config.call_timeout
};

client.bind();

client.on("listening", function () {

  var message = new Buffer(JSON.stringify(service_info));
  client.setBroadcast(true);

  console.log('Sending server info ' + message + ' to port ' + broadcast_port );

  setInterval(function() {
  	client.send(message, 0, message.length, broadcast_port, broadcast_address);

  } , 20000);

});
