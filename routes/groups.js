var express = require('express');
var router = express.Router();
var app = express();
var Group = require('../models/group');


router.get('/', function(req, res) {

  Group.find({},'id name paydesks clients', function(err,groups)
  {
      res.json(groups);
  });
  

});


router.get('/:id',function(req,res)
{
  Group.findOne({id: req.params.id },'id name paydesks clients', function(err,group)
  {
      if (group === null) res.json([],404);

      res.json(group);

  });
});


router.post('/', function(req, res) {

  var newGroup = new Group(req.body);

  newGroup.save(function(err,group) {

      if (err) res.json(err);
      
      res.json(group);
  });
  
});

module.exports = router;