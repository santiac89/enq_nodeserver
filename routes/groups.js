var express = require('express');
var router = express.Router();
var app = express();
var number_generator = require('../util/number_generator');
var Group = require('../models/group');
var Client = require('../models/client');
var Paydesk = require('../models/paydesk');

router.get('/', function(req, res) {
res.json({a: number_generator.get()});
/*Group.find({},function(err,groups) {
   res.json(groups);
});*/
});


router.get('/:id',function(req,res) {
  Group.findOne({_id: req.params.id }, function(err,group) {
      if (group === null) res.json(404,err);
      res.json(group);
  });
});


router.post('/', function(req, res) {
  new Group(req.body).save(function(err,group) {
      if (err) res.json(500,err);
      res.json(group);
  });
});

router.put('/:id', function(req, res) {
  Group.findOne({_id: req.params.id }, function(err,group) {
    if (group === null) res.json(404,[]);
    var newGroup = new Group(req.body);
    group.name = newGroup.name;
    group.timeout = newGroup.timeout;
    group.paydesks = newGroup.paydesks;
    group.save(function(err,group) {
      if (err) res.json(500,err);
      res.json(group);
    });
  });
});

router.delete('/:id', function(req, res) {
  Group.findOne({_id: req.params.id },function(err,group) {
    if (err) res.json(404,err);
    group.remove();
    res.json(group);

  });
});

router.post('/:id/clients', function(req, res) {

  Group.findOne({_id: req.params.id }, function(err,group) {
      
      if (group === null) res.json(404,err);
      
      var client = new Client(req.body);

      client.number = number_generator.get();

      client.save(function(err) {

        if (err) {
          console.log(err);
          res.json(500,err);
        }

        group.clients.push(client._id);

        group.save(function(err,group) {
        
          if (err) {
              console.log(err);
              res.json(500,err);
          }
        
          res.json({estimated: 0, number: client.number});
        
        });

      });
  });

});

router.get('/:id/clients/next', function(req, res) {

  Group.find({_id: req.params.id }).populate('paydesks clients').exec(function(err,group) {
    
    if (group === null) res.json(404,err);
    
    var client = group.clients.pop();

    if (client === undefined) res.json(404,{});

    group.save(function(err,group) {
        if (err) res.json(500,err);
        res.json(group);
    });

    var selectedPaydesk = group.paydeskWithLessClients();

    Paydesk.populate(selectedPaydesk,{path: 'current_client', component: 'Client'},function(err, paydesk) {

    });

    if (selectedPaydesk.current_client) {
      //TODO Guardar registro del cliente para estadisticas y borrarlo si ya es su segunda vez
    }

    selectedPaydesk.current_client = client;

    selectedPaydesk.save(function(err,paydesk)
    {
          //TODO Llamar al cliente y esperar confirmacion?
          res.json(client);
    });

  });
});

module.exports = router;