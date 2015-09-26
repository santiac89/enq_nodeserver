var net = require('net');

var responses = [
  (c) => { c.write('extend\n'); c.end(); } ,
  (c) => { c.write('confirm\n'); c.end(); } ,
  (c) => { c.write('cancel\n'); c.end(); } ,
  (c) => {  } ,
];

var server = net.createServer(function(c) { //'connection' listener
  responses[getRandomInt(0,3)](c);
});

server.listen(3131, function() { //'listening' listener
  console.log('server bound');
});


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
