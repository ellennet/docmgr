let uuid = require('uuid');
let moment = require('moment');
let co = require('co');
let mongodb = require('mongodb');
let Grid = require('gridfs-stream');
let fs = require('fs');
let request = require('request');

let config = require('../modules/config');
let ossMinio = require('../modules/oss-minio');
let categorieCore = require('../modules/categorieCore');
let thisModule = require('../modules/fsCore');

let uri = config.mongodbUri;

//全局搜索tag
exports.searchFileWithTag = (keywords) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');

      var qs = new RegExp(keywords); //
      console.log(keywords);
      var where = {
        'tags': qs
      };
      fsMongo.find(where).toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      }); //end list 
    } catch (error) {
      reject(error);
    }
  });
};

//目录内搜索备注
exports.searchFileWithTagInCat = (keywords, cid) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');

      var qs = new RegExp(keywords); //
      console.log(keywords);
      var where = {
        'tags': qs,
        'cid': cid
      };
      fsMongo.find(where).toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      }); //end list 
    } catch (error) {
      reject(error);
    }
  });
};


//全局搜索备注
exports.searchFileWithRemark = (keywords) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');

      var qs = new RegExp(keywords); //
      console.log(keywords);
      var where = {
        'remarks': qs
      };
      fsMongo.find(where).toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      }); //end list 
    } catch (error) {
      reject(error);
    }
  });
};

//目录内搜索备注
exports.searchFileWithRemarkInCat = (keywords, cid) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');

      var qs = new RegExp(keywords); //
      console.log(keywords);
      var where = {
        'remarks': qs,
        'cid': cid
      };
      fsMongo.find(where).toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      }); //end list 
    } catch (error) {
      reject(error);
    }
  });
};

//全局搜索文件名
exports.searchFileWithName = (keywords) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');

      var qs = new RegExp(keywords); //
      console.log(keywords);
      var where = {
        'ofilename': qs
      };
      fsMongo.find(where).toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      }); //end list 
    } catch (error) {
      reject(error);
    }
  });
};

//目录内搜索文件名
exports.searchFileWithNameInCat = (keywords, cid) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');

      var qs = new RegExp(keywords); //
      console.log(keywords);
      var where = {
        'ofilename': qs,
        'cid': cid
      };
      fsMongo.find(where).toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      }); //end list 
    } catch (error) {
      reject(error);
    }
  });
};

//with auth
exports.searchFile = (keywords) => {
  //keywords 关键词  
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      var qs = new RegExp(keywords);
      //or                                
      fsMongo.find({
        '$or': [{
          'ofilename': qs
        }, {
          'tags': qs
        }]
      }).toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      }); //end list        
    } catch (error) {
      reject(error);
    }
  }); // end promise  
};

//获得目录下文件的个数
exports.getFileCount = (id) => {
  //id:目录id
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      fsMongo.find({
        'ancestors': id
      }).toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.length);
        }
      }); //end list        
    } catch (error) {
      reject(error);
    }
  }); // end promise
};

//获得文件信息
exports.getFileInfo = (id) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      fsMongo.find({
        id: id
      }).limit(1).toArray((err, docs) => { //读取文件
        if (err) {
          reject(err);
        } else {
          if (docs.length === 1) {
            resolve(docs[0]);
          } else {
            reject('not found');
          }
        }
      }); //end list      
    } catch (error) {
      reject(error);
    }
  }); // end promise    
};

//根据文件id得到key和转换状态ts
exports.getFileKey = (id) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      fsMongo.find({
        id: id
      }).limit(1).toArray((err, docs) => { //读取文件
        if (err) {
          reject(err);
        } else {
          if (docs.length === 1) {

            let path = docs[0].path;
            let uploadDirInPath = config.uploadDirInPath;
            let fn = path.replace(uploadDirInPath, ''); //文件名
            let arrayFn = fn.split('.');
            if (arrayFn.length == 2) {
              let key = arrayFn[0];
              let ts = docs[0].tranStatus;
              resolve([key, ts]);
            } else
              reject('not found');
          } else {
            reject('not found');
          }
        }
      }); //end list      
    } catch (error) {
      reject(error);
    }
  }); // end promise      
};

//得到目录下所有文件，包括子目录
exports.listFileRoot = (cid) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      fsMongo.find({
        ancestors: cid
      }).toArray((err, docs) => {
        if (err)
          reject(err);
        else
          resolve(docs);
      }); //end list       
    } catch (error) {
      reject(error);
    }
  }); // end promise  
};

//获得目录下所有文件
exports.listFile = (cid) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      fsMongo.find({
        cid: cid
      }).toArray((err, docs) => {
        if (err)
          reject(err);
        else
          resolve(docs);
      }); //end list       
    } catch (error) {
      reject(error);
    }
  }); // end promise
};

//根据文件名称及目录ID， 返回所有同名文件记录
exports.listFileByName = (cid, name) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      fsMongo.find({
        cid: cid,
        ofilename: name
      }).toArray((err, docs) => {
        if (err)
          reject(err);
        else
          resolve(docs);
      }); //end list

    } catch (error) {
      reject(error);
    }
  });
};

//目录下是否有重名文件 重名返回id,不重名返回false
exports.duplicate = (cid, name) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      fsMongo.find({
        cid: cid,
        ofilename: name
      }).limit(1).next((err, doc) => {
        if (err) {
          reject(err);
        } else {
          if (doc === null)
            resolve(false);
          else
            resolve(doc.id);
        }
      });

    } catch (error) {
      reject(error);
    }
  });
};

//目录下是否有文件
exports.hasFile = (cid) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      fsMongo.find({
        cid: cid
      }).toArray((err, docs) => {
        if (err) {
          reject(err);
        }
        if (docs.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }); //end find      
    } catch (error) {
      reject(error);
    }
  });
};

//修改文件转换状态
exports.SetTranStatus = (fid, status) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');

      fsMongo.updateOne({
        id: fid
      }, {
        $set: {
          tranStatus: status
        }
      }, (err, r) => {
        if (err) reject(err);
        else resolve(r);
      });
    } catch (error) {
      reject(error);
    }
  });
};

//获取bimviz token
function GetBimvizToken() {
  return new Promise((resolve, reject) => {
    var url = config.BimVizUrl + '/api/user/token?devKey=' + config.DevKey;

    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let obj = JSON.parse(body);
        resolve(obj.token);
      } else {
        reject(response);
      }
    });

  });
}

//上传到bimviz
function UploadFile2Bimviz(path, bimvizUsername, bimvizProjectId, token, originalFilename) {
  return new Promise((resolve, reject) => {
    let url = config.BimVizUrl + '/api/project/UploadProjectFiles?username=' + bimvizUsername + '&projid=' + bimvizProjectId;
    var formData = {
      'file': {
        value: fs.createReadStream(path),
        options: {
          filename: originalFilename
        }
      }

    };
    request.post({
      url: url,
      headers: {
        'Authorization': 'bearer ' + token
      },
      formData: formData
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        reject(err);
      }
      resolve(body);
    });

  });
}

//文件上传到到bimviz
exports.sendToBimviz = (path, bimvizUsername, bimvizProjectId, originalFilename) => {

  return new Promise((resolve, reject) => {
    co(function* () {

      //获取token
      let token = yield GetBimvizToken();
      yield UploadFile2Bimviz(path, bimvizUsername, bimvizProjectId, token, originalFilename);
    }).then(() => {
      resolve('');
    }, (err) => {
      reject(err);
    });
  });
};

//写入文件到fsgrid
exports.writeFile = (path, originalFilename) => {
  return new Promise((resolve, reject) => {

    let uploadDirInPath = config.uploadDirInPath;
    let fileName = path.replace(uploadDirInPath, ''); //get filename

    try {
      let gfs = Grid(global.db, mongodb);
      let writestream = gfs.createWriteStream({
        filename: fileName
      });
      fs.createReadStream(path).pipe(writestream);
      writestream.on('close', (file) => {
        console.log(file.filename + ' Written To DB');
        resolve(true);
      });
    } catch (error) {
      reject(error);
    }
  });
};

//获取目录下某个文件名的版本号
exports.getVer = (cid, ofilename) => {



};

//上传文件信息 可自定义时间及修改用户
exports.uploadFile2 = (cid, ofilename, path,
  size, headers, remarks, tags, username, cUser, uUser, cTime, uTime, id) => {
  return new Promise((resolve, reject) => {

    try {
      let fileId = id;

      if (fileId === undefined) {
        fileId = uuid.v1();
      }

      let fsMongo = global.db.collection('fs');

      let categorie;
      co(function* () {
        categorie = yield categorieCore.getById(cid);
      }).then(() => {

        //目录的家族不包含目录本身，对于文件来说上级目录也是家族，所以push到数组中
        categorie.ancestors.push(cid);

        //标准文件对象
        let obj = {
          id: fileId, //文件id
          cid: cid, //目录ID
          ofilename: ofilename, //原始文件名
          path: path, //路径
          size: size, //文件大小       
          headers: headers, //headers
          cUser: cUser, //创建用户
          uUser: uUser, //最后修改用户
          cTime: cTime, //创建时间
          uTime: uTime, //最后修改时间
          remarks: remarks, //备注
          tags: tags, //tags
          ancestors: categorie.ancestors, //家族数组
          tranStatus: 0 //文档转换状态： 0未转换 1转换中 2转换完成 -1无法转换
        };

        //判断是否文件重名，如果重名，版本+1
        //todo

        //创建相关记录
        fsMongo.insertOne(obj).then((r) => {
          resolve(obj.id);
        }, (err) => {
          reject(err);
        }); //end insert                                           
      }, (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  }); //end promise
};

//上传文件的信息 
exports.uploadFile = (cid, ofilename, path, size, headers, remarks, tags, username, id) => {
  return new Promise((resolve, reject) => {
    try {
      let fileId = id;

      if (fileId === undefined) {
        fileId = uuid.v1();
      }

      let fsMongo = global.db.collection('fs');

      let categorie;
      let isDuplication; //文件是否重名
      co(function* () {
        categorie = yield categorieCore.getById(cid);
        isDuplication = yield thisModule.duplicate(cid, ofilename);

      }).then(() => {
        //判断是否文件重名，如果重名，版本+1
        //todo
        if (isDuplication) {
          //获取当前版本号

        }

        //------------------------

        //目录的家族不包含目录本身，对于文件来说目录也是家族，所以push到数组中
        categorie.ancestors.push(cid);

        //标准文件对象
        let obj = {
          id: fileId, //文件id
          cid: cid, //目录ID 
          ofilename: ofilename, //原始文件名
          path: path, //路径
          size: size, //文件大小       
          headers: headers, //headers
          cUser: username, //创建用户
          uUser: username, //最后修改用户
          cTime: moment().format(), //创建时间
          uTime: moment().format(), //最后修改时间
          remarks: remarks, //备注
          tags: tags, //tags
          ancestors: categorie.ancestors, //家族数组
          tranStatus: 0 //文档转换状态： 0未转换 1转换中 2转换完成 -1无法转换
        };

        //创建相关记录
        fsMongo.insertOne(obj).then((r) => {
          resolve(obj.id);
        }, (err) => {
          reject(err);
        }); //end insert                                           
      }, (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  }); //end promise
};

//更新某个目录下的所有文件的祖先数组
exports.updateFilesAnceInCategorie = (cid, ancestorsToFile, username) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      //目录下所有文件
      let uUser = username;
      let uTime = moment().format();
      let o = {
        w: 1
      };
      o.multi = true;
      // Update multiple documents using the multi option
      fsMongo.updateMany({
          cid: cid
        }, {
          $set: {
            uUser: uUser,
            uTime: uTime,
            ancestors: ancestorsToFile
          }
        },
        o, (err, r) => {
          if (err)
            reject(err);
          else
            resolve(r);
        });
    } catch (error) {
      reject(error);
    }
  });
};

//移动文件
//fid 文件ID；cid 目标目录ID
exports.moveFile = (fid, cid, username) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');

      //得到目标目录的祖先队列并push(cid)
      let doc;
      let ancestors;
      co(function* () {
        doc = yield categorieCore.getById(cid);
        ancestors = doc.ancestors;
        ancestors.push(cid);
      }).then(() => {
        let uUser = username;
        let uTime = moment().format();

        fsMongo.updateOne({
          id: fid
        }, {
          $set: {
            uUser: uUser,
            uTime: uTime,
            cid: cid,
            ancestors: ancestors
          }
        }, (err, r) => {
          if (err) reject(err);
          else resolve(r);
        });
      }, (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  }); //end promise
};

//删除物理文件
exports.deletePhyFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        if (err.errno === -4058) {
          //文件不存在 移除记录
          resolve(true);
        } else {
          reject(err);
        }
      } else {
        resolve(true);
      }
    });
  });
};

//删除文件
exports.deleteFile = (fid) => {
  return new Promise((resolve, reject) => {
    try {
      let fsMongo = global.db.collection('fs');
      //根据文件id得到记录
      fsMongo.find({
          id: fid
        })
        .limit(1).toArray((err, docs) => {
          if (err) {
            reject(err);
          } else {
            if (docs.length === 1) {
              //从gridfs中及本地删除文件
              let uploadDirInPath = config.uploadDirInPath;
              let fileName = docs[0].path.replace(uploadDirInPath, ''); //get filename
              //移除fs表记录 
              fsMongo.deleteOne({
                  id: fid
                },
                (err, results) => {
                  if (err) {
                    reject(err);
                  } else {
                    if (config.oss) {
                      resolve(ossMinio.deleteFile(fid)); //从oss中移除
                    } else {
                      //移除本地文件
                      fs.unlink(docs[0].path, (err) => {
                        //移除gridfs记录                                    
                        try {
                          let gfs = Grid(global.db, mongodb);
                          gfs.remove({
                            filename: fileName
                          }, (err) => {
                            if (err) {
                              reject(err);
                            } else {
                              resolve(true);
                              console.log('delete success');
                            }
                          });
                        } catch (error) {
                          reject(error);
                        }
                      });
                    }
                  }
                }
              );

            } else {
              reject('not found');
            }
          }
        }); //end find         
    } catch (error) {
      reject(error);
    }
  }); //end promise
};