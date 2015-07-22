var config = {};

config.serverName = "DevEnqServer";
config.broadcastPort = 6000;
config.mongo = {};
config.mongo.address = "localhost";
config.mongo.port = 27017;
config.mongo.db = "enq";

module.exports = config;
