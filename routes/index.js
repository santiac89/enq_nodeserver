var express = require('express');
var router = express.Router();
var Group = require('../models/group');


 

/* GET home page. */
router.get('/', function(req, res) {

res.render('adminangular');
/*Group.find({},'id name paydesks clients', function(err,groups)
{
 		res.render('adminangular', { groups: groups });
});*/
 
 

});

module.exports = router;
