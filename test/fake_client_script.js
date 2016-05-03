// var net = require('net');
// var cluster = require('cluster');

// var responses = [
//   (c) => { console.log('extend'); c.write("extend");  } ,
//   (c) => { console.log('confirm'); c.write("confirm");  } ,
//   (c) => { console.log('cancel'); c.write("cancel");  } ,
//   (c) => { console.log('timeout'); } ,
// ];

// function getRandomInt(min, max) {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }


// if (cluster.isMaster) {

//     var cpuCount = require('os').cpus().length;

//     // Create a worker for each CPU
//     for (var i = 0; i < cpuCount; i += 1) {
//      cluster.fork();
//     }

//   } else {

//     var server = net.createServer(function(c) { //'connection' listener
//     c.on('data',function(data) {
//     console.log(data.toString())
//     responses[getRandomInt(0,3)](c);
//     })
// });

// server.listen(3131, function() { //'listening' listener
//   console.log('server bound');
// });

//   }
