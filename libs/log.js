var winston = require('winston');

function getFileLogger(){
    var logger = new (winston.Logger)({
        transports: [
          new (winston.transports.Console)(),
          new (winston.transports.File)({ filename: 'somefile.log' })
        ]
      });

    return logger;
}

function getLogger(module) {
    var path = module.filename.split('/').slice(-2).join('/'); //using filename in log statements

    return new winston.Logger({
        transports : [
            new winston.transports.Console({
                colorize:   true,
                level:      'debug',
                label:      path
            })
        ]
    });
}

module.exports = getLogger;
module.exports = getFileLogger;