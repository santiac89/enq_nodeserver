var mongoose = require('mongoose');

var queueSchema = mongoose.Schema({
	id: Number,
    name: String,
    image: String,
    items: []
});

queueSchema.methods.add = function (newItem) {
  	//this.items.push(newItem);
};

queueSchema.methods.getEstimatedToNext = function (newItem) {

};

queueSchema.methods.getPromedio = function (newItem) {
	
	var sum = 0;

	for (var i in this.items)
	{
		sum += this.items[i].getEstimated();
	}

	return sum / this.items.length;

};

var Queue = mongoose.model('Queue', queueSchema);

module.exports = Queue;