let request = require('request');
let co = require('co');
let util = require('util');

let cipher = require('../modules/cipher');
let access = require('../modules/access');

//验证token 返回token中的用户名
exports.ValidateToken = (token) => {
  return new Promise((resolve, reject) => {
    if (util.isNullOrUndefined(token)) {
      reject('#token error#');
    } else {
      let login;
      co(function* () {
        login = yield access.verifyToken(token, '');
      }).then(() => {
        resolve(login.user); //返回用户名
      }, (err) => {
        reject(err);
      });
    }
  });
};

//gettoken
exports.getToken = (user) => {
  return new Promise((resolve, reject) => {

    //服务认证
    //生成签名 (登录用户名:服务密码@服务ID)
    let key = cipher.Sha1(user + ':' + global.servicePassword + '@' + global.serviceId);
    let options = {
      url: global.tokenServer + '/gettoken',
      headers: {
        '_authSKWSUser': user, //登录的用户
        '_authSKWSSID': global.serviceId, //服务ID
        '_authSKWSKey': key //签名   
      }
    };
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(response.body);
      } else {
        reject(error);
      }
    });
  });
};

//get user service token
exports.getUserServiceToken = () => {
  return new Promise((resolve, reject) => {

    let serviceIdUser = 'service-userauth-v1'; //服务ID 这个服务ID目前就是用来与用户验证服务匹配
    let servicePasswordUser = 'sk63214501!'; //服务密码
    let appPass = 'skmis+63214501'; //用户名，这里写对应AppId的密码 与顺凯管理共用一套用户  

    //生成签名 (应用密码:服务密码@服务ID)
    let key = cipher.Sha1(appPass + ':' + servicePasswordUser + '@' + serviceIdUser);

    let options = {
      url: global.tokenServer + '/gettoken',
      headers: {
        '_authSKWSUser': appPass, //
        '_authSKWSSID': 'service-userauth-v1', //服务ID
        '_authSKWSKey': key //签名   
      }
    };
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(response.body);
      } else {
        reject(error);
      }
    });
  });
};

//validate user 与顺凯管理共用一套用户
exports.validateUser = (username, password, token) => {
  return new Promise((resolve, reject) => {
    let options = {
      url: global.userServer + '/users',
      headers: {
        '_authSKToken': token, //token
        '_username': username,
        '_password': password,
        '_appId': 'SK-MIS' //应用编号
      }
    };
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(response.body);
      } else {
        reject(error);
      }
    });
  });
};