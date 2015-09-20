var config = {};

config.server_name = "DevEnqServer";
config.broadcast_port = 6000;
config.mongo = {};
config.mongo.address = "localhost";
config.mongo.port = 27017;
config.mongo.db = "enq";
config.call_timeout = 120000;
config.reenqueue_limit = 2;
module.exports = config;
