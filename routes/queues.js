var express = require('express');
var router = express.Router();
var Queue = require('../models/queue');
var passport = require('passport');

//passport.authenticate('digest', { session: false }),

/**
*	GET queues listing
*/
router.get('/', 
 function(req, res) {
  
  var queueList = req.app.get('queueList');

  if (req.query.op == 'search') {
   
    for (var i in queueList) {
      for (var o in queueList[i].items) {
        console.log(req.query);
        if (queueList[i].items[o] == req.query.hmac) {
          res.json(queueList[i]);
        }
      }
    }

    res.json(queueList);

  }
  else
  {
    res.send("No op");
  }

});


/**
*	GET queue info
*/
router.get('/{:qid}', function(req, res) {
  res.send('respond with a resource');
});


/**
*	GET queue people info
*/
router.get('/{:qid}/items', function(req, res) {
  res.send('respond with a resource');
});

/**
*	DELETE person from queue (Call next in line), return next person info
*/
router.delete('/{:qid}/items', function(req, res) {
  res.send('respond with a resource');
});


module.exports = router;