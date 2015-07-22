var dgram = require('dgram');
var app = require('../app');
var client = dgram.createSocket("udp4");
var config = require('../config.js');
var network = require('../util/network');
var winston = require('winston');

var broadcastAddress = network.broadcast();
var broadcastPort = config.broadcastPort;
var serviceInfo = {address: network.address(), port: process.argv[2], name: config.serverName};

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.DailyRotateFile)({ filename: 'log/broadcast_service.log' ,handleExceptions: true})
    ]
});

client.bind();
client.on("listening", function () {


	var message = new Buffer(JSON.stringify(serviceInfo));
	client.setBroadcast(true);

    setInterval(function() {
    
	client.send(message, 0, message.length, broadcastPort, broadcastAddress,function( err, bytes) {
		logger.info("Sent " + message + " to " + broadcastAddress);
	});

    } , 10000);


    
});