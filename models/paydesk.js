var mongoose = require('mongoose')
var clientSchema = require('./client');
var Schema = mongoose.Schema;

var paydeskSchema = mongoose.Schema({

  number: { type: Number, required: true },
  current_client:  [clientSchema],
  called_client:  [clientSchema],
  estimated: Number,
  active: Boolean

});

module.exports = paydeskSchema;
