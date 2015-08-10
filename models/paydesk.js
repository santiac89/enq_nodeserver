var mongoose = require('mongoose');

var paydeskSchema = mongoose.Schema({

	number: { type: Number, required: true , unique: true},
	group:  { type: Number, ref: 'Group' },
	current_client:  { type: Number, ref: 'Client' },
	estimated: Number,
	active: Boolean,
	clients: Array,
    
});

var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = Paydesk;