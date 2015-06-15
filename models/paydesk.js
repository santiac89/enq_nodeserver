var mongoose = require('mongoose');

var paydeskSchema = mongoose.Schema({

	id: Number,
	group: Number,
	active: Boolean,
	clients: Array
    
});

var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = Paydesk;