var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var groupSchema = mongoose.Schema({

	id: { type: Number, required: true , unique: true},
    name: { type: String, required: true , unique: true},
	paydesks: Array,
    clients: Array
    
});


groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

module.exports = Group;