var config = {};

config.server_name = "DevEnqServer";
config.server_port = 8080;
config.service_discovery = {};
config.service_discovery.broadcast_listen_port = 6000;
config.service_discovery.client_announce_port = 6001;
config.mongo = {};
config.mongo.address = "localhost";
config.mongo.port = 27017;
config.mongo.db = "enq";
config.call_timeout = 30;
config.reenqueue_limit = 2;
config.admin = {};
config.admin.password = "admin";
module.exports = config;
