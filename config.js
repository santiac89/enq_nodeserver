var config = {};

config.serverName = "DevEnqServer";
config.broadcastPort = 6000;
config.mongo = {};
config.mongo.address = "localhost";
config.mongo.port = 27017;
config.mongo.db = "enq";
config.callTimeout = 5000;
module.exports = config;
