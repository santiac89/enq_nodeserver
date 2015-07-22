var mongoose = require('mongoose');

var paydeskSchema = mongoose.Schema({

	number: { type: Number, required: true , unique: true},
	group:  { type: Number, ref: 'Group' },
	estimated: Number,
	active: Boolean,
	clients: Array
    
});

var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = Paydesk;