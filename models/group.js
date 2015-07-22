var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var groupSchema = mongoose.Schema({

	timeout: { type: Number, required: true , unique: false},
    name: { type: String, required: true , unique: true},
	paydesks:  [{ type: Number, ref: 'Paydesk' }],
    clients: Array
    
});


groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

module.exports = Group;