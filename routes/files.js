let express = require('express');
let router = express.Router();

let co = require('co');
let fs = require('fs');
let multiparty = require('multiparty');
let request = require('request');
let uuid = require('uuid');

let fsCore = require('../modules/fsCore');
let logCore = require('../modules/logCore');
let config = require('../modules/config');
let token = require('../modules/token');

let ossMinio = require('../modules/oss-minio');

let urlencode = require('urlencode');
const {
  connectLogger
} = require('log4js');


// router.get('/reset/:id/:filecount', function(req, res, next) {
//   let id = req.params.id;
//   let filecount = req.params.filecount;
//   let cgcore = require('../modules/categorieCore');
//   co(function*() {

//     yield cgcore.setFileCount(id,filecount);
//   }).then(function() {
//     res.send('ok');
//   }, function(err) {
//     res.send('#error#' + err);
//   }); //end co     
// });


//目录下的文件列表 with auth
//:/files?cid=id get
router.get('/', (req, res, next) => {
  let cid = req.query.cid; //目录id   
  let _token = req.get('_token'); //附带的token
  let username;
  let docs;
  co(function* () {
    username = yield token.ValidateToken(_token);
    docs = yield fsCore.listFile(cid);
  }).then(() => {
    res.send(docs);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  }); //end co     
});

//获取某个文件的相关信息
//:/files/info/id get
router.get('/info/:id', (req, res, next) => {
  let id = req.params.id; //文件id  
  let doc;

  let _token = req.get('_token'); //header附带的token
  if (typeof _token === 'undefined') {
    _token = req.query._token; //如果header中没有token ，尝试从查询串中找
  }

  let username;
  co(function* () {
    username = yield token.ValidateToken(_token);
    doc = yield fsCore.getFileInfo(id);
  }).then(() => {
    res.send(doc);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  }); //end co       
});

//获取某个文件(流)
//:/files/stream/id get
router.get('/stream/:id', (req, res, next) => {
  let id = req.params.id; //文件id  
  let read_stream;
  let doc;

  let _token = req.get('_token'); //header附带的token
  if (typeof _token === 'undefined') {
    _token = req.query._token; //如果header中没有token ，尝试从查询串中找
  }

  let username;
  co(function* () {
    username = yield token.ValidateToken(_token);
    doc = yield fsCore.getFileInfo(id);
    if (config.oss) {
      read_stream = yield fsCore.getFileFromOss(doc);
    } else {
      read_stream = yield fsCore.getFile(doc);
    }
  }).then(() => {
    //res.download(doc.path, doc.ofilename);  
    read_stream.pipe(res);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  }); //end co       
});

//获取某个文件(下载) with auth
//:/files/id get
router.get('/:id', (req, res, next) => {
  let id = req.params.id; //文件id  
  let read_stream;
  let doc;

  let _token = req.get('_token'); //header附带的token
  if (typeof _token === 'undefined') {
    _token = req.query._token; //如果header中没有token ，尝试从查询串中找
  }

  let username;
  let fileUrl;

  co(function* () {
    username = yield token.ValidateToken(_token);
    fileUrl = yield ossMinio.getFileUrl(id); //获取下载地址      
  }).then(() => {
    res.redirect(fileUrl);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  }); //end co

});

//移动文件 with auth
//:/files?fid=&cid= put
router.put('/', (req, res) => {
  let fid = req.query.fid; //文件id
  let cid = req.query.cid; //目标目录id
  let _token = req.get('_token'); //附带的token
  let username;

  co(function* () {
    username = yield token.ValidateToken(_token);
    yield fsCore.moveFile(fid, cid, username);
  }).then(() => {
    logCore.info(username, '移动文件' + fid + '到' + cid);
    res.send('#ok#');
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  }); //end co
});

//删除文件 with auth
//:/files/id delete
router.delete('/:id', (req, res) => {
  let id = req.params.id; //文件id
  let _token = req.get('_token'); //附带的token
  let username;

  co(function* () {
    username = yield token.ValidateToken(_token);
    fsCore.deleteFile(id);
  }).then(() => {
    logCore.info(username, '删除文件' + id);
    res.send('#ok#');
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  }); //end co    
});

//上传文件 with auth
//:/files form post
router.post('/', (req, res, next) => {

  //header附带的token
  let _token = req.get('_token');
  if (typeof _token === 'undefined') {
    _token = req.query._token; //如果header中没有token ，尝试从查询串中找
  }

  let username;

  co(function* () {
    username = yield token.ValidateToken(_token);
  }).then(() => {

    console.log(config.uploadDir);
    if (!fs.existsSync(config.uploadDir)) {
      console.log('容器内目录不存在？');
    } else {
      console.log('容器内数据目录：' + config.uploadDir);
    }

    let form = new multiparty.Form({
      uploadDir: config.uploadDir
    });
    form.parse(req, (err, fields, files) => {
      console.log('form.parse');
      console.log(err);

      if (err) {
        logCore.error(username, err);
        res.send('#error#' + +err);
      } else {
        //单文件接收     
        try {
          let theFile;
          if (typeof files.file1 === 'undefined') {
            theFile = files.file[0];
          } else {
            theFile = files.file1[0];
          }

          console.log('接收文件');

          let headers = theFile.headers;
          let originalFilename = theFile.originalFilename;
          let path = theFile.path;
          let size = theFile.size;

          //form表单自动生成的文件名
          let fileNewName = path.replace('doc\\SkDocMgr\\', '');

          console.log(fileNewName);

          let key; //自动生成的文件名前缀
          let ext; //文件扩展名
          //let words; //tika抽取的内容                              

          if (size === 0) {
            //如果size为0 删除
            fs.unlink(path, (err) => {
              if (err) {
                logCore.error(username, err);
                res.send('#error#' + +err);
              }
            });
          } else {
            let cid = fields.cid[0]; //目录id
            let remarks = fields.remarks[0]; //备注
            let tags = fields.tags[0]; //tags      

            //bimviz
            let bimviz; //是否bimviz文件 1
            let busername; //bimviz username
            let bprojectid; //bimviz projectid
            if (typeof fields.bimviz[0] !== null &&
              typeof fields.busername[0] !== null &&
              typeof fields.bprojectid[0] !== null) {
              bimviz = fields.bimviz[0];
              busername = fields.busername[0];
              bprojectid = fields.bprojectid[0];
            }


            let cUser; //创建用户
            let uUser; //最后修改用户
            let cTime; //创建时间
            let uTime; //最后修改时间            

            if (fields.cUser !== undefined)
              cUser = fields.cUser[0]; //创建用户

            if (fields.uUser !== undefined)
              uUser = fields.uUser[0]; //最后修改用户

            if (fields.cTime !== undefined)
              cTime = fields.cTime[0]; //创建时间

            if (fields.uTime !== undefined)
              uTime = fields.uTime[0]; //最后修改时间

            //新建文件id
            let fId = uuid.v1();

            if (
              typeof cid === 'undefined' ||
              typeof remarks === 'undefined' ||
              typeof tags === 'undefined'
            ) {
              res.send('#error#缺失信息');
            } else {
              let fileId;

              co(function* () {
                if (config.oss) {
                  //开启oss，写入到oss中，成功后删除本地文件
                  yield ossMinio.uploadFile(path, fId);
                } else {
                  //无oss，写入到gridfs中，保留本地文件                
                  yield fsCore.writeFile(path, originalFilename);
                }

                //将文件上传到bimviz中
                if (typeof (bimviz) !== 'undefined' && bimviz == '1') {
                  if (busername !== undefined && bprojectid !== undefined) {
                    yield fsCore.sendToBimviz(path, busername, bprojectid, originalFilename);
                  }
                }

                // fs.unlink(path, (err) => {
                //   if (err) {
                //     logCore.error(username, err);
                //   }
                // });                

                //写入文件信息
                if (
                  typeof cUser === 'undefined' ||
                  typeof uUser === 'undefined' ||
                  typeof cTime === 'undefined' ||
                  typeof uTime === 'undefined'
                ) {
                  //没有用户及日期信息
                  fileId = yield fsCore.uploadFile(cid, originalFilename, path,
                    size, headers, remarks, tags, username, fId);
                } else {
                  //上传了用户及日期信息
                  fileId = yield fsCore.uploadFile2(cid, originalFilename, path,
                    size, headers, remarks, tags, username, cUser, uUser, cTime, uTime, fId);
                }

                let tranPDFHost = config.TranPDFHost;

                if (tranPDFHost !== '') {
                  let farray = fileNewName.split('.');
                  if (farray.length === 2) {
                    //如果是可转换文件，发送请求到服务要求转换为pdf(doc,docx,xls,xlsx)
                    key = farray[0];
                    ext = farray[1];
                    ext = ext.toLowerCase();
                    if (ext === 'doc' || ext === 'docx' || ext === 'xls' || ext === 'xlsx' || ext === 'pdf') {
                      //文档转换状态设置为1 转换中
                      yield fsCore.SetTranStatus(fileId, 1);
                      let url = tranPDFHost + '?fid=' + fileId + '&k=' + key + '&f=' + fileNewName;
                      console.log(url);
                      request(url, (error, response, body) => {
                        //异步处理 无需等待返回
                      });
                    } else {
                      //无法转换pdf的格式，文档转换状态设置为-1
                      yield fsCore.SetTranStatus(fileId, -1);
                    }
                  }
                }
              }).then(() => {
                logCore.info(username, '上传文件' + fileId + '到' + cid);
                res.send(fileId);
              }, (err) => {
                logCore.error(username, err);
                console.error(err);
                res.send('#error#' + err);
              }); //end co                                     
            }
          }
        } catch (error) {
          logCore.error(username, err);
          console.error(err);
          res.send('#error#' + err);
        }
      }
    }); //end form parse     

  }, (err) => {
    logCore.error(username, err);
    console.error(err);
    res.send('#error#' + err);
  });

}); //end post

module.exports = router;