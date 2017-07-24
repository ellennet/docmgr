let uuid = require('uuid');
let moment = require('moment');
let co = require('co');

let fsCore = require('../modules/fsCore');
let thisModule = require('../modules/categorieCore');

exports.getAll = () => {
  return new Promise((resolve, reject) => {
    try {
      //let docs = null;
      let categories = global.db.collection('categories');
      categories.find().toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

//根据目录层及名称，得到目录
exports.getCategorieByLevel = (level, name) => {
  return new Promise((resolve, reject) => {
    try {
      let length = level - 1;
      let categories = global.db.collection('categories');
      categories.find({
        'name': name,
        'ancestors': {
          '$size': length //根据层级确定祖先数组的长度 
        }
      }).toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

//递归 遍历目录
exports.getDeep = (pid, pObj) => {
  return new Promise((resolve, reject) => {
    try {
      let docs;
      co(function* () {
        docs = yield thisModule.getChildById(pid); //得到所有子目录
        pObj.childDocs = docs; //在根对象上创建子目录的对象
        if (docs != null) {
          for (let doc of docs) {
            doc.childDocs = yield thisModule.getDeep(doc.id, doc); //递归 add子目录对象                        
          }
        } else {
          resolve(null);
        }
      }).then(() => {
        resolve(docs);
      }, (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

//pid:被复制目录的父ID，nid：复制到这个目录的目录ID
exports.copyDo = (pid, nid, username) => {
  return new Promise((resolve, reject) => {
    try {
      let docs;

      co(function* () {
        docs = yield thisModule.getChildById(pid); //得到所有子目录

        if (docs != null) {
          for (let doc of docs) {
            //复制doc到nid中
            let id = yield thisModule.createCategorie(doc.name, nid, doc.ctype, doc.tags, doc.remarks, username, doc.order, doc.UserCode);
            yield thisModule.copyDo(doc.id, id, username);
          }
        } else {
          resolve(null);
        }
      }).then(() => {
        resolve(true);
      }, (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

//复制目录
//parent：复制到哪个目录下，name：新目录的名称，sourceId从哪个目录复制（只复制这个目录的所有子目录）
exports.copy = (parent, name, sourceId, username, order, UserCode, tags, remarks) => {
  return new Promise((resolve, reject) => {
    try {
      let newCateId; //新目录的ID

      co(function* () {
        //在parent中创建新目录
        newCateId = yield thisModule.createCategorie(name, parent, 'd', tags, remarks, username, order, UserCode);

        //遍历sourceId中的各级子目录并创建
        yield thisModule.copyDo(sourceId, newCateId, username);

      }).then(() => {
        resolve(newCateId);
      }, (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

//是否重名 重名返回id,不重名返回false
exports.duplicate = (parent, name) => {
  return new Promise((resolve, reject) => {
    try {
      let categories = global.db.collection('categories');
      categories.find({
        parent: parent,
        name: name
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

exports.getCategorieFromCache = (docid) => {
  return new Promise((resolve, reject) => {
    try {
      let cacheCategorie = global.db.collection('cacheCategorie');
      cacheCategorie.find({
        docid: docid,
      }).limit(1).next((err, doc) => {
        if (err) {
          reject(err);
        } else {
          if (doc === null)
            resolve(null);
          else
            resolve(doc);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

//缓存目录结构
exports.cacheCategorie = (docid, categorie) => {
  return new Promise((resolve, reject) => {
    try {
      let cacheCategorie = global.db.collection('cacheCategorie');
      cacheCategorie.findOneAndUpdate({
          docid: docid
        }, {
          $set: {
            categorie: categorie
          }
        }, {
          returnOriginal: false,
          upsert: true
        },
        (err, r) => {
          if (err) {
            reject(err);
          } else {
            resolve('ok');
          }
        });
    } catch (error) {
      reject(error);
    }
  });
};

//创建目录
exports.createCategorie = (name, parent, ctype, tags, remarks, username, order, UserCode) => {
  return new Promise((resolve, reject) => {
    try {
      let categories = global.db.collection('categories');

      //标准目录对象                  
      let obj = {
        id: uuid.v1(), //目录id
        name: name, //目录名称
        cUser: username, //创建用户
        uUser: username, //最后修改用户
        cTime: moment().format(), //创建时间
        uTime: moment().format(), //最后修改时间
        remarks: remarks, //备注
        tags: tags, //tags
        ctype: ctype, //类型
        parent: parent, //父ID
        ancestors: [], //家族数组
        children: false, //是否有子目录
        order: order //排序号
      };

      if (parent != null) {
        //根据parent找出并更新children                                                                     
        categories.find({
            id: parent
          })
          .limit(1).toArray((err, docs) => {
            if (err) {
              reject(err);
            }

            if (docs.length == 1) {
              //得到父目录信息后更新子目录的ancestors
              obj.ancestors = docs[0].ancestors;
              obj.ancestors.push(docs[0].id);

              //三凯定制用 UserCode
              obj.UserCode = UserCode;

              //先更新父目录的ancestors
              categories.findOneAndUpdate({
                  id: parent
                }, {
                  $set: {
                    children: true
                  }
                } //父目录有子目录
                , {
                  returnOriginal: false,
                  upsert: true
                },
                (err, r) => {
                  if (err) {
                    reject(err);
                  } else {
                    //新建目录
                    categories.insertOne(obj).then((r) => {
                      resolve(obj.id);
                    });
                  }
                });
            } else {
              reject('not found');
            }
          });
      } else {
        //根目录                
        categories.insertOne(obj).then((r) => {
          resolve(obj.id);
        });
      }
    } catch (error) {
      reject(error);
    }
  });
}; //创建目录结束

//修改目录 name remarks tags uUser uTime
exports.updateCategorie = (id, name, tags, remarks, username) => {
  return new Promise((resolve, reject) => {
    try {
      let categories = global.db.collection('categories');

      //先找出来，然后修改
      categories.find({
          id: id
        })
        .limit(1).toArray((err, docs) => {
          if (err) {
            reject(err);
          }
          if (docs.length == 1) {
            let obj = docs[0];

            if (name === null)
              name = obj.name;

            if (tags === null)
              tags = obj.tag;

            if (remarks === null)
              remarks = obj.remarks;

            let uUser = username;
            let uTime = moment().format();

            categories.updateOne({
              id: id
            }, {
              $set: {
                name: name,
                remarks: remarks,
                tags: tags,
                uUser: uUser,
                uTime: uTime
              }
            }, (err, r) => {
              if (err) reject(err);
              resolve();
            });
          } else {
            reject('not found');
          }
        });
    } catch (error) {
      reject(error);
    }
  });
}; //修改目录结束

//强制删除目录 级联 包括文件
exports.deleteForce = (id) => {
  return new Promise((resolve, reject) => {
    try {
      let categories = global.db.collection('categories');

      //删除所有相关文件
      //通过祖先队列找到文件，物理删除，fs中删除
      co(function* () {
        let files = yield fsCore.listFileRoot(id);
        for (let myfile of files) {
          yield fsCore.deleteFile(myfile.id);
        }
      }).then(() => {
        //删除祖先队列中所有包含该ID的数据            
        categories.deleteMany({
          ancestors: id
        }, (err, results) => {
          if (err) {
            reject(err);
          } else {
            //删除自身
            categories.deleteOne({
              id: id
            }, (err, results) => {
              if (err) {
                reject(err);
              } else {
                resolve(true);
              }
            });
          }
        });

      }, (err) => {
        reject(err);
      }); //end co                                            
    } catch (error) {
      reject(error);
    }
  });
};

//删除目录
exports.deleteCategorie = (id) => {
  //如果有子目录或者文件，无法删除。
  //删除后父级目录检查是否有子目录并修改相关字段  
  return new Promise((resolve, reject) => {
    try {
      let categories = global.db.collection('categories');

      categories.find({
          id: id
        })
        .limit(1).toArray((err, docs) => {
          if (err) {
            reject(err);
            return;
          }
          if (docs.length === 1) {
            let obj = docs[0];

            if (obj.children) {
              reject('has child');
            } else {
              let hasFile = false;
              co(function* () {
                hasFile = yield fsCore.hasFile(id);
              }).then(() => {
                if (hasFile) {
                  reject('has file');
                } else {
                  let pid = obj.parent; //父目录

                  //删除目录记录
                  categories.deleteOne({
                      id: id
                    },
                    (err, results) => {
                      if (err) {
                        reject(err);
                      } else {
                        //检查父目录下是否还有子目录，如果没有childern=false                        
                        categories.find({
                          parent: pid
                        }).toArray((err, pdocs) => {
                          if (err) {
                            reject(err);
                            return;
                          }
                          if (pdocs.length === 0) {
                            //父目录  childern=false
                            categories.updateOne({
                              id: pid
                            }, {
                              $set: {
                                children: false
                              }
                            }, (err, r) => {
                              if (err) reject(err);
                              resolve();
                            });
                          } else {
                            resolve();
                          }
                        });
                      }
                    });
                }
              }, (err) => {
                reject(err);
              });
            }
          } else {
            reject('not found');
          }
        });
    } catch (error) {
      reject(error);
    }
  });
}; //删除目录结束

//更新目标目录下的children字段状态
exports.updateCategorieChildren = (cid, children, username) => {
  return new Promise((resolve, reject) => {

    let uUser = username;
    let uTime = moment().format();

    try {
      let categories = global.db.collection('categories');
      categories.updateOne({
        id: cid
      }, {
        $set: {
          uUser: uUser,
          uTime: uTime,
          children: children
        }
      }, (err, r) => {
        if (err) reject(err);
        else resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

//移动目录 todo
//sid:被移动目录id，tid：目标目录id
exports.moveCategorie = (sid, tid, username) => {
  return new Promise((resolve, reject) => {

    //查询目标目录信息
    try {
      let categories = global.db.collection('categories');

      let tDoc; //目标目录
      let sDoc; //被移动目录
      let ancestors; //被移动目录新的祖先队列
      let ancestorsToFile; //被移动目录下文件的新祖先队列

      co(function* () {

        tDoc = yield thisModule.getById(tid);
        sDoc = yield thisModule.getById(sid);

        if (!sDoc.children) {
          ancestors = tDoc.ancestors;
          ancestors.push(tDoc.id);

          ancestorsToFile = ancestors;
          ancestorsToFile.push(sid);

          //更新目标目录下文件的祖先队列
          yield fsCore.updateFilesAnceInCategorie(sid, ancestorsToFile, username);

          //更新目标目录的children为true
          yield thisModule.updateCategorieChildren(tid, true, username);
        } else {
          reject('has children');
        }
      }).then(() => {
        //修改被移动目录的信息
        //parent uTime uUser ancestors
        let uUser = username;
        let uTime = moment().format();
        categories.updateOne({
          id: sid
        }, {
          $set: {
            uUser: uUser,
            uTime: uTime,
            parent: tDoc.id,
            ancestors: ancestors
          }
        }, (err, r) => {
          if (err) reject(err);
          resolve();
        });

      }, (err) => {
        reject(err);
      }); //end co         
    } catch (error) {
      reject(error);
    }
  });
};


//search system
//根据ID得到目录信息
exports.getById = (id) => {
  return new Promise((resolve, reject) => {
    try {
      let categories = global.db.collection('categories');
      categories.find({
          id: id
        })
        .limit(1).toArray((err, docs) => {
          if (err) {
            reject(err);
          }
          if (docs.length === 1) {
            resolve(docs[0]);
          } else {
            reject('not found');
          }
        });
    } catch (error) {
      reject(error);
    }
  });
};

//根据名称得到相关目录
exports.getByName = (name) => {
  return new Promise((resolve, reject) => {
    try {
      let categories = global.db.collection('categories');
      categories.find({
        name: name
      }).toArray((err, docs) => {
        if (err)
          reject(err);
        else
          resolve(docs);
      });
    } catch (error) {
      reject(error);
    }
  });
};

//根据ID得到一级子目录
exports.getChildById = (pid) => {
  return new Promise((resolve, reject) => {
    try {
      let categories = global.db.collection('categories');
      //第一级子目录
      categories.find({
          parent: pid
        }).sort({
          'order': 1
        })
        .toArray()
        .then((docs) => {
          resolve(docs);
        });
    } catch (error) {
      reject(error);
    }
  });
};

//得到所有根目录
exports.getRoot = () => {
  return new Promise((resolve, reject) => {
    try {
      let categories = global.db.collection('categories');
      categories.find({
          parent: null
        }).sort({
          'order': 1
        })
        .toArray()
        .then((docs) => {
          console.log('core get root ok');
          resolve(docs);
        });
    } catch (error) {
      reject(error);
    }
  });
};