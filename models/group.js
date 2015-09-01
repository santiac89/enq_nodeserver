var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

var groupSchema = mongoose.Schema({

	timeout: { type: Number, required: true , unique: false},
    name: { type: String, required: true , unique: true},
    estimated: Number,
	paydesks:  [{ type: Schema.Types.ObjectId, ref: 'Paydesk' }],
    clients: [{ type: Schema.Types.ObjectId, ref: 'Client' }],

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

groupSchema.pre('remove', function(next){
    this.model('Paydesk').remove(
        {_id: { $in: this.paydesks }},
        next
    );
});


groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

module.exports = Group;
