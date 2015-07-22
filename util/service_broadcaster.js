var dgram = require('dgram');
var app = require('../app');
var client = dgram.createSocket("udp4");
var os = require('os');
var ip = require('ip');
// Obtener broadcast ip de la red

var broadcastAddress = "192.168.0.255";
var broadcastPort = 6000;

var serverAddress = ip.address();

//TODO: Pasarlo a archivos de configuracion. Averiguar como se hace.

var serverPort = 3000;
var serverName = "DevEnqServer";

var serviceInfo = {address: ip.address(), port: serverPort, name: serverName};

client.bind();
client.on("listening", function () {


	var message = new Buffer(JSON.stringify(serviceInfo));
	client.setBroadcast(true);

    setInterval(function() {
    
	client.send(message, 0, message.length, broadcastPort, broadcastAddress,function( err, bytes) {
		console.log("Sent " + message + " to the wire...");
	});

    } , 10000);


    
});