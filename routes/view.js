let express = require('express');
let router = express.Router();

let co = require('co');
let token = require('../modules/token');
let fsCore = require('../modules/fsCore');

//预览某个文件 with auth
//:/files/id get
router.get('/:id', (req, res, next) => {
  let id = req.params.id; //文件id  

  let _token = req.get('_token'); //header附带的token
  if (typeof _token === 'undefined') {
    _token = req.query._token; //如果header中没有token ，尝试从查询串中找
  }

  let ret;
  let key;
  let tranStatus = req.query.ts; //转换状态 为2的时候才能预览  
  co(function* () {
    let username = yield token.ValidateToken(_token);
    ret = yield fsCore.getFileKey(id);
    key = ret[0];
    tranStatus = ret[1];

  }).then(() => {
    if (tranStatus === '2') {
      res.redirect('/pv/web/viewer.html?key=' + key);
    } else {
      res.send('该文档无法预览！');
    }
  }, (err) => {
    res.send('error: ' + err);
  }); //end co       
});

module.exports = router;