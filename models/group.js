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


groupSchema.methods.enqueueClient = function(client, callback) {
    // if (typeof callback === 'undefined') { callback = function() {}; };
	this.clients.push(client._id);
    return this;
    // this.save(function(err) {
        // if (!err) callback();
    // });
};

groupSchema.methods.reenqueueClient = function(client, callback) {
    // if (typeof callback === 'undefined') { callback = function() {}; };
    this.clients.removeObj(client);
    this.clients.push(client);
    return this;
    // this.save(function(err) {
        // if (!err) callback();
    // });
};

groupSchema.methods.removeClient = function(client, callback) {
    // if (typeof callback === 'undefined') { callback = function() {}; };
    this.clients.removeObj(client);
    return this;
    // this.save(function(err) {
        // if (!err) callback();
    // });
}

groupSchema.pre('remove', function(next){
    this.model('Paydesk').remove(
        {_id: { $in: this.paydesks }},
        next
    );
});


groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

module.exports = Group;
