var local_number_generator = {
  max: 9999,
  numbers: []
};

local_number_generator.get = function(callback)
{
      var number = 0;

      while (number++ < this.max) {
        if (!this.numbers[number]) {
          this.numbers[number] = true;
          return number;
        }
      }
};

local_number_generator.release = function(number)
{

      this.numbers[number] = false;

}

module.exports = local_number_generator;
