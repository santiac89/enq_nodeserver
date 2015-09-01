var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var paydeskSchema = mongoose.Schema({

	number: { type: Number, required: true , unique: true},
	group:  { type: Schema.Types.ObjectId, ref: 'Group' },
	current_client:  { type: Schema.Types.ObjectId , ref: 'Client' },
	estimated: Number,
	active: Boolean,

});

paydeskSchema.pre('remove', function(next){
    this.model('Group').update({_id: this.group._id },
      {$pull: {paydesks: this._id}},
      {multi: true},
      next
    );
});

var Paydesk = mongoose.model('Paydesk', paydeskSchema);

module.exports = Paydesk;
