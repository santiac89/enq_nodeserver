var mongoose = require('mongoose');

var clientSchema = mongoose.Schema({

	number:  { type: Number, required: false , unique: true},
	hmac:  { type: String, required: true , unique: true},
	ip:  { type: String, required: true , unique: true},
	reenqueue_count: { type: Number, default: 0 },
  enqueue_time: Number,
  called_time: Number,
  exit_time: Number,
  status: { type: String, default: "idle" }
});

clientSchema.pre('remove', function(next) {

    this.model('Paydesk').update({
      current_client: this._id
    },
    {
      current_client: null
    },
    {
      multi: true
    },
    this.model('Group').update({
      clients: {
        $in: [ this._id ]
      }
    },
    { $pull:
      {
        clients: this._id
      }
    },
    next));
});

clientSchema.methods.setReenqueued = function(status) {
  // if (typeof callback === 'undefined') { callback = function() {}; };
  this.reenqueue_count++;
  this.status = status;
  return this;
  // this.save(function(err) {
  //   if (!err) callback();
  // });
}

clientSchema.methods.setConfirmed = function(callback) {
  // if (typeof callback === 'undefined') { callback = function() {}; };
  this.status = "confirmed";
  return this;
  // this.save(function(err) {
    // if (!err) callback();
  // });
}

clientSchema.methods.setCalled = function() {
  // if (typeof callback === 'undefined') { callback = function() {}; };
  this.status = 'called';
  this.called_time = Date.now();
  return this;
  // this.save(function(err) {
    // if (!err) callback();
  // });
}

var Client = mongoose.model('Client', clientSchema);

Client.STATUS = { waiting: 0, called: 1, confirmed: 2, cancelled: 3 };


module.exports = Client;
