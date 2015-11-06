var mongoose = require('mongoose')
var clientSchema = require('./client');
var Schema = mongoose.Schema;

var paydeskSchema = Schema({

  number: { type: Number, required: true },
  current_client:  [clientSchema],
  called_client:  [clientSchema],
  active: { type: Boolean, default: false }

});

module.exports = paydeskSchema;
