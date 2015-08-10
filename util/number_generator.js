var cluster = require('cluster');
var number_generator = {
	max: 9999,
	numbers: []
};

number_generator.get = function()
{
	var number = 0;

	while (number++ < this.max)
	{
		if (!this.numbers[number]) {
			this.numbers[number] = true;
			console.log((process.argv[2] == 'nodejs' ? cluster.worker.id : process.threadId) + '-' + number);
			return number;
		}
	}

};

number_generator.release = function(number)
{
	this.numbers[number] = false;
}

module.exports = number_generator;