var cluster = require('cluster');

var store = jxcore.store.shared;

var number_generator = {
	max: 9999
};

number_generator.get = function()
{
	store.safeBlock('numbers',function() {

		var number = 0;
		var numbers = shared.read('numbers').splice(',');

		while (number++ < this.max) {
			if (!numbers[number]) {
				numbers[number] = true;
				store.set('numbers',numbers.toString());
				//console.log((process.argv[2] == 'nodejs' ? cluster.worker.id : process.threadId) + '-' + number);
				return number;
			}
		}

	});
	

};

number_generator.release = function(number)
{
	store.safeBlock('numbers',function() {

		var numbers = shared.read('numbers').splice(',');
		numbers[number] = false;
		store.set('numbers',numbers.toString());

	});
	
}

module.exports = number_generator;