var mongoose = require('mongoose');
var config = require('../config');
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = mongoose.Schema({
  role: String
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model('User', userSchema);

module.exports = User;
