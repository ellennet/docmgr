let cipher = require('../modules/cipher');
let moment = require('moment');
let config = require('../modules/config');

//验证appid
exports.checkAppId = (appid) => {
  return new Promise((resolve, reject) => {
    try {
      if (config.appIds.indexOf(appid) >= 0) {
        resolve(true);
      }
    } catch (error) {
      reject('appid error');
    }
  });
};

//根据appid计算出appkey
exports.generateAppKey = (appid) => {
  return new Promise((resolve, reject) => {
    try {
      let buf = appid + '$sKyGeoINFO'; //密文
      let appKey = cipher.Encryptor('des3', '', buf);
      resolve(appKey);
    } catch (error) {
      reject(error);
    }
  });
};

//验证签名
exports.checkSign = (appid, user, sign) => {
  return new Promise((resolve, reject) => {
    try {
      //1 根据appid计算出appkey
      let buf = appid + '$sKyGeoINFO'; //密文
      let appKey = cipher.Encryptor('des3', '', buf);

      //2 根据固定算法计算出签名
      let key = 'zhb-' + user + '$' + appid + '$' + appKey;
      let signGen = cipher.HmacSha256(key, appKey);

      if (sign === signGen)
        resolve();
      else
        reject('sign error');
    } catch (error) {
      reject(error);
    }
  });
};

//生成token
exports.generateToken = (appid, user, ip) => {
  return new Promise((resolve, reject) => {
    try {
      let dt = moment().format();

      //token中包含的信息
      let s = 'doc#' + appid + '#' + user + '#' + dt + '#' + ip;
      //通过aes生成token
      let token = cipher.Encryptor('des3', '', s);
      resolve(token);
    } catch (error) {
      reject(error);
    }
  });
};

//验证token
exports.verifyToken = (token, ip) => {
  return new Promise((resolve, reject) => {
    try {
      if (token === undefined) {
        reject('token error');
      } else {
        let d = cipher.Decryptor('des3', '', token);
        if (d === 'error') {
          reject('token error');
        } else {
          let ss = d.split('#');
          if (ss.length === 5) {

            let user = decodeURIComponent(ss[2]); //转为中文

            let loginObj = {
              'appid': ss[1],
              'user': user,
              'dt': ss[3],
              'ip': ss[4]
            };

            let dtNow = new Date();
            let dtToken = new Date(loginObj.dt);
            let timeDiff = (dtNow - dtToken) / 3600000; //差值为毫秒，转小时  

            //4小时过期           
            if (timeDiff > 4) {
              reject('token timeout');
            } else {
              resolve(loginObj);
            }
          } else {
            reject('token error');
          }
        }
      }
    } catch (error) {
      reject(error);
    }
  });
};