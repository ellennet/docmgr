let co = require('co');
let OSS = require('ali-oss');

let config = require('../modules/config');

let client = new OSS({
  region: 'oss-cn-shenzhen',
  accessKeyId: '*',
  accessKeySecret: '*',
  bucket: 'skdocmgr'
});

//上传文件到oss
exports.uploadFile = (path, fileId) => {
  return new Promise((resolve, reject) => {
    co(function* () {
      //client.useBucket('skdocmgr');
      let objectKey = config.appIds + '_' + fileId;
      let result = yield client.put(objectKey, path);
      resolve(result);
    }).catch(function (err) {
      reject(err);
    });
  });
};

//从oss中删除文件
exports.deleteFile = (fileId) => {
  return new Promise((resolve, reject) => {
    co(function* () {
      let objectKey = config.appIds + '_' + fileId;
      let result = yield client.delete(objectKey);
      resolve(result);
    }).catch(function (err) {
      reject(err);
    });
  });
};

//获取下载地址
exports.getFileUrl = (fileId) => {
  let objectKey = config.appIds + '_' + fileId;
  //获取地址，30秒内有效
  let url = client.signatureUrl(objectKey, {
    expires: 30
  });
  return url;
};
