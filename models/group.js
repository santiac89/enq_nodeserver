var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var groupSchema = mongoose.Schema({

	timeout: { type: Number, required: true , unique: false},
    name: { type: String, required: true , unique: true},
    estimated: Number,
	paydesks:  [{ type: Number, ref: 'Paydesk' }],
    clients: Array
    
});


groupSchema.methods.paydeskWithLessClients = function() {

	var min = 999;
    var selectedPaydesk = {};
    for (var i in this.paydesks) {
      if (this.paydesks[i].clients.length < min) {
        min = this.paydesks[i].clients.length;
        selectedPaydesk = this.paydesks[i];
      }
    }

    return selectedPaydesk;
};


groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

module.exports = Group;