var os = require('os');
var ip = require('ip');
var network = {};

network.address = function() { return ip.address(); };

network.netmask = function() {
	var ifaces = os.networkInterfaces();

	for (iface in ifaces) {
		for (var i = 0; i < ifaces[iface].length;i++) {
			if (ifaces[iface][i].address == ip.address())	{
				return ifaces[iface][i].netmask;
			}
		}
	}
};

network.broadcast = function() {
	return ip.subnet(ip.address(), network.netmask()).broadcastAddress;
};

module.exports = network;
