var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var clientSchema = require('./client');
var paydeskSchema = require('./paydesk');
var Schema = mongoose.Schema;

var groupSchema = mongoose.Schema({

	timeout: { type: Number, required: true , unique: false},
    name: { type: String, required: true , unique: true},
    estimated: Number,
	paydesks:  [paydeskSchema],
    clients: [clientSchema],

});


groupSchema.methods.enqueueClient = function(client, callback) {
	this.clients.push(client);
    return this;
};

groupSchema.methods.reenqueueClient = function(client, callback) {
    this.removeClient(client);
    this.enqueueClient(client);
    return this;
};

groupSchema.methods.removeClient = function(client, callback) {
    var i = this.clients.indexOf(client);
    return this.clients.splice(i,1);
};


groupSchema.plugin(uniqueValidator);

var Group = mongoose.model('Group', groupSchema);

Group.findByPaydesk = function(id) {
    return this.findOne({ paydesks: { $elemMatch: { _id: id } }});
};

Group.findByPaydeskNumber = function(number) {
    return this.findOne({ paydesks: { $elemMatch: { number: number } }});
};


Group.getAllPaydesks = function() {

    this.find({},'paydesks').exec(function(err, groups) {

        var paydesks = [];

        for (i=0; i < groups.length; i++) {
          for (o=0; o < groups[i].paydesks.length; o++) {

            paydesks.push(groups[i].paydesks[o]);

          }
        }

    });

};

Group.findByClient = function(id) {
    return this.findOne({ clients: { $elemMatch: { _id: id } }});
};

module.exports = Group;
