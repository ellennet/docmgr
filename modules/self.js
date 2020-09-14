//供本地WEB使用的模块
let categorieCore = require('../modules/categorieCore');
let fsCore = require('../modules/fsCore');

let co = require('co');

//得到目录中的文件 并返回filetable格式的json数据
exports.getFileInNode = (cid, token) => {
  return new Promise((resolve, reject) => {
    try {
      let docs;
      co(function* () {
        docs = yield fsCore.listFileRoot(cid);
      }).then(() => {
        for (let doc of docs) {
          let kb = Math.ceil(parseInt(doc.size) / 1024);
          doc.size = kb;
          doc['token'] = token;
        }
        resolve(docs);
      }, (err) => {
        reject(err);
      }); //end co        
    } catch (error) {
      reject(error);
    }
  });
};


//得到dhtmlx tree node
exports.getTreeNode = (pid) => {
  return new Promise((resolve, reject) => {
    try {
      let docs;
      let ret = [];
      co(function* () {
        docs = yield categorieCore.getChildById(pid);
      }).then(() => {
        for (let doc of docs) {
          let obj = {
            'id': doc.id,
            'text': doc.name,
            'children': doc.children
          };
          ret.push(obj);
        }
        resolve(ret);
      }, (err) => {
        reject(err);
      }); //end co        
    } catch (error) {
      reject(error);
    }
  });
};

//得到dhtmlx tree root
exports.getTreeRoot = () => {
  return new Promise((resolve, reject) => {
    try {
      let docs;
      let ret = [];
      co(function* () {
        docs = yield categorieCore.getRoot();
      }).then(() => {
        for (let doc of docs) {
          let obj = {
            'id': doc.id,
            'text': doc.name,
            'children': doc.children
          };
          ret.push(obj);
        }
        resolve(ret);
      }, (err) => {
        reject(err);
      }); //end co        
    } catch (error) {
      reject(error);
    }
  });
};