let express = require('express');
let router = express.Router();
let co = require('co');
let fsCore = require('../modules/fsCore');
let logCore = require('../modules/logCore');
let token = require('../modules/token');

//:/filesQuery?action=?&xxxx get header _token
router.get('/', (req, res, next) => {

  let _token = req.get('_token'); //附带的token
  let username;
  let action = req.query.action;
  let ret;

  co(function* () {
    username = yield token.ValidateToken(_token);

    //根据关键词 查询文件名称、tags with auth
    if (action === 'search') {

      let q = req.query.q; //关键词      
      ret = yield fsCore.searchFile(q);
    }

    //同目录下，文件是否重名
    if (action === 'duplicate') {

      let cid = req.query.cid; //目录id
      let name = req.query.name; //文件名称

      if (typeof cid === 'undefined' || typeof name === 'undefined')
        ret = '#error#参数不全';
      else
        ret = yield fsCore.duplicate(cid, name);
    }

    if (action === 'listfileroot') {
      let cid = req.query.cid; //目录id
      if (typeof cid === 'undefined')
        ret = '#error#参数不全';
      else
        ret = yield fsCore.listFileRoot(cid);
    }

    //查询目录下的文件，同名文件只取最新
    if (action === 'listFileByName') {

      let cid = req.query.cid; //目录id
      let name = req.query.name; //文件名称

      if (typeof cid === 'undefined' || typeof name === 'undefined')
        ret = '#error#参数不全';
      else
        ret = yield fsCore.listFileByName(cid, name);
    }

  }).then(() => {
    res.send(ret);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  });

});


module.exports = router;