var mongoose = require('mongoose');
require('../util/prototypes');
var config = require('../config');
mongoose.connect('mongodb://'+config.mongo.address+':'+config.mongo.port+'/'+config.mongo.db);
var Client = require('../models/client');
var Paydesk = require('../models/paydesk');
var Group = require('mongoose').model('Group');

process.on('message', function(data) {

//  console.log('\033[2J');

  Group.find().populate('paydesks clients').exec(function(err, groups) {

    var line = "";

    for (i=0; i < groups.length; i++) {
      line += groups[i].name + '\n';

      line += "[ ";
     for (o=0; o < groups[i].clients.length; o++) {
        line += ' ' + groups[i].clients[o].number+"("+groups[i].clients[o].status+") ";
      }
      line += " ]\n";


      for (p=0; p< groups[i].paydesks.length; p++) {

        paydesk = groups[i].paydesks[p];


        line += paydesk.number + ": "+(paydesk.current_client ? paydesk.current_client+"("+paydesk.current_client.status+")" : "")+' ' ;


      }

      line += '\n';

    }

    console.log(line);

  });

});





