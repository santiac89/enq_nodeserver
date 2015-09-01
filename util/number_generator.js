var cluster = require('cluster');

var redis_client = require('redis').createClient();
redis_client.set('numbers',[].toString());

var number_generator = {
	max: 9999
};

number_generator.get = function(callback)
{
		redis_client.get('numbers', function(err, reply) {

			var number = 0;
			var numbers = reply.split(',');

			while (number++ < this.max) {
				if (!numbers[number]) {
					numbers[number] = true;
					console.log(numbers);
					redis_client.set('numbers',numbers.toString());
					callback(number);
				}
			}

		});
};

number_generator.release = function(number)
{

		redis_client.get('numbers', function(err,reply) {
			var numbers = reply.split(',');
			numbers[number] = false;
			redis_client.set('numbers',numbers.toString());
		});

}

module.exports = number_generator;
