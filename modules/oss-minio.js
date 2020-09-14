let co = require('co');
let config = require('../modules/config');
let Minio = require('minio');

var minioClient = new Minio.Client(config.minioConfig);

//上传文件到oss
exports.uploadFile = (path, fileId) => {
  return new Promise((resolve, reject) => {    
    minioClient.fPutObject(config.minioBucket, fileId, path, function (err, etag) {
      if (err) {
        reject(err);
      } else {
        console.log('File uploaded successfully.');
        resolve('ok');
      }
    });
  });
};

//从oss中删除文件
exports.deleteFile = (fileId) => {
  return new Promise((resolve, reject) => {
    minioClient.removeObject(config.minioBucket, fileId, function (err) {
      if (err) {
        reject(err);
      } else {
        console.log('Removed the object');
        resolve('ok');
      }
    });
  });
};

//获取下载地址,300秒有效
exports.getFileUrl = (fileId) => {
  return new Promise((resolve, reject) => {
    minioClient.presignedGetObject(config.minioBucket, fileId, 300, function (err, presignedUrl) {
      if (err) {
        reject(err);
      } else {
        console.log(presignedUrl);
        resolve(presignedUrl);
      }
    });
  });
};