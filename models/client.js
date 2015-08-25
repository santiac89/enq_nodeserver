var mongoose = require('mongoose');

var clientSchema = mongoose.Schema({

	number:  { type: Number, required: false , unique: true},
	hmac:  { type: String, required: true , unique: true},
	ip:  { type: String, required: true , unique: true},
	reenqueue_count: Number
});

var Client = mongoose.model('Client', clientSchema);

Client.STATUS = { waiting: 0, called: 1, confirmed: 2, cancelled: 3 };

module.exports = Client;