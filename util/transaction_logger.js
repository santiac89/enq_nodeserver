var winston = require('winston');

var transaction_logger = new (winston.Logger)({
    transports: [
      new (winston.transports.DailyRotateFile)({ filename: 'log/transactions.log' ,handleExceptions: true})
    ]
});

module.exports = transaction_logger;