var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var paydeskSchema = require('./paydesk');
var clientSchema = require('./client');
var groupSchema = mongoose.Schema({

	timeout: { type: Number, required: true , unique: false},
    name: { type: String, required: true , unique: true},
    estimated: Number,
	paydesks:  [paydeskSchema],
    clients: [clientSchema]
    
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


groupSchema.methods.updateDoc = function(valueObj) {
   
}


groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

module.exports = Group;