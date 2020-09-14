var uuid = require('uuid');
var mongodb = require('mongodb');
var moment = require('moment');
var co = require('co');
var categorieCore = require('../modules/categorieCore');

//验证用户权限
//type：对象类型(c,f)，id：对象id， usr: 用户
//返回：{auth:bool,rw:r or w or d}
function checkAuthSingle(type, id, usr) {
  return new Promise((resolve, reject) => {
    var auth = global.db.collection('auth');
    auth.find({
      objId: id,
      objType: type
    }).limit(1).next((err, doc) => {
      if (err) {
        reject(err);
      } else {
        if (doc === null) {
          //无权限信息
          resolve({
            auth: false,
            rw: ''
          });
        } else {
          var read = false,
            write = false,
            download = false;

          //用户是否在读列表或者是写列表中或是在下载列表中
          if (doc.read != null && doc.read.indexOf(usr) != -1) {
            read = true;
          }
          if (doc.write != null && doc.write.indexOf(usr) != -1) {
            write = true;
          }
          if (doc.download != null && doc.download.indexOf(usr) != -1) {
            download = true;
          }

          if (write) {
            resolve({
              auth: true,
              rw: 'w'
            }); //写权限            
          } else {
            if (download) {
              resolve({
                auth: true,
                rw: 'd'
              }); //下载权限               
            } else {
              if (read) {
                resolve({
                  auth: true,
                  rw: 'r'
                }); //预览权限                 
              } else {
                resolve({
                  auth: false,
                  rw: ''
                }); //无权限                
              }
            }
          }
        }
      }
    });
  });
}

//type：对象类型(d,f)，id：对象id， usr: 用户
//返回：{auth:bool,rw:r or w}
exports.checkAuth = (type, id, usr) => {
  return new Promise((resolve, reject) => {
    try {
      var result;
      co(function* () {
        result = yield checkAuthSingle(type, id, usr); //查自身权限    
      }).then(() => {
        resolve(result);
      }, (err) => {
        reject(err);
      }); //end co
    } catch (error) {
      reject(error);
    }
  });
}

//得到对象权限
//type：对象类型，id：对象id
exports.getAuth = (type, id) => {
  return new Promise((resolve, reject) => {
    try {
      var auth = global.db.collection('auth');
      auth.find({
        objId: id,
        objType: type
      }).limit(1).next((err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

//删除权限
//type：对象类型，id：对象id
exports.removeAuth = (type, id) => {
  return new Promise((resolve, reject) => {
    try {
      var auth = global.db.collection('auth');
      auth.deleteOne({
        objType: type,
        objId: id
      }, (err, results) => {
        if (err)
          reject(err);
        else
          resolve(results);
      });
    } catch (error) {
      reject(error);
    }
  });
}

//创建或修改权限 
//type：对象类型，id：对象id，rList: 可读用户数组，wList可写用户数组
exports.createOrUpdateAuth = (type, id, rList, wList, dList) => {
  return new Promise((resolve, reject) => {
    try {
      var auth = global.db.collection('auth');

      //标准权限对象
      var obj = {
        id: uuid.v1(),
        objType: type, //对象类型，目录d 文件f
        objId: id, //对象id,目录id或者是文件id
        read: rList, //可读用户 数组
        write: wList, //可写用户 数组
        download: dList //可下载用户 数组
      }

      //对象权限数据是否存在
      auth.find({
        objId: id,
        objType: type
      }).limit(1).next((err, doc) => {
        if (err) {
          reject(err);
        } else {
          if (doc === null) {
            //不存在 insert
            auth.insertOne(obj).then((r) => {
              resolve(r);
            });
          } else {
            //update
            auth.updateOne({
              id: doc.id
            }, {
              $set: {
                read: rList,
                write: wList,
                download: dList
              }
            }, (err, r) => {
              if (err)
                reject(err);
              else
                resolve(r);
            });
          }
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}