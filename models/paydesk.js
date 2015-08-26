var mongoose = require('mongoose');
var clientSchema = require('./client');

var paydeskSchema = mongoose.Schema({

	number: { type: Number, required: true , unique: true},
	current_client: [clientSchema],
	estimated: Number,
	active: Boolean,
	clients: Array,
    
});

var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = paydeskSchema;