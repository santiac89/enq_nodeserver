var mongoose = require('mongoose');

var clientSchema = mongoose.Schema({

	hmac: String
    
    
});

var Client = mongoose.model('Client', clientSchema);

module.exports = Client;