var log4js = require('log4js');

log4js.configure({
  appenders: { info: { type: "file", filename: "logs/info.log" } },
  categories: { default: { appenders: ["info"], level: "error" } }
});


exports.info = (username, s) => {
  let logger = log4js.getLogger('info');
  logger.info(username + ':' + s);
};

exports.error = (username, s) => {
  let logger = log4js.getLogger('info');
  logger.error(username + ':' + s);
};