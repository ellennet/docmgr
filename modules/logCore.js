var log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/info.log'), 'info');
log4js.addAppender(log4js.appenders.file('logs/error.log'), 'error');

exports.info = (username, s) => {
  let logger = log4js.getLogger('info');
  logger.info(username + ':' + s);
};

exports.error = (username, s) => {
  let logger = log4js.getLogger('error');
  logger.setLevel('ERROR');
  logger.error(username + ':' + s);
};