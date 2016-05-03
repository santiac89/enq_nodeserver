var winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: 'log/enq.log' , handleExceptions: false})
    ]
});

module.exports = logger;
