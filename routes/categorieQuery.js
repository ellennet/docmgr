let express = require('express');
let router = express.Router();

let co = require('co');
let categorieCore = require('../modules/categorieCore');
let logCore = require('../modules/logCore');
let token = require('../modules/token');

//:/categorieQuery?action=?&xxxx get header _token
router.get('/', (req, res, next) => {

  let _token = req.get('_token'); //附带的token
  let username;
  let action = req.query.action;
  let ret;

  co(function* () {
    username = yield token.ValidateToken(_token);

    //根据目录层及名称，得到目录
    if (action === 'getctg') {
      let level = req.query.level;
      let name = req.query.name;

      if (typeof level === 'undefined' || typeof name === 'undefined')
        ret = '#error#参数不全';
      else
        ret = yield categorieCore.getCategorieByLevel(level, name);
    }

    //同目录下，目录是否重名
    if (action === 'duplicate') {

      let parent = req.query.parent;
      let name = req.query.name;

      if (typeof parent === 'undefined' || typeof name === 'undefined')
        ret = '#error#参数不全';
      else
        ret = yield categorieCore.duplicate(parent, name);
    }

    //递归目录
    if (action === 'getdeep') {
      let id = req.query.id;
      if (typeof id === 'undefined') {
        ret = '#error#缺少参数';
      } else {

        let doc = yield categorieCore.getById(id);
        let docs = yield categorieCore.getDeep(id, doc);
        doc.childDocs = docs;
        ret = doc;
      }

    }

    //复制目录 返回新目录的ID
    if (action === 'copy') {
      //pid：复制到哪个目录下，name：新目录的名称，sid从哪个目录复制（只复制这个目录的所有子目录）
      //pid,name,sid,username,order,usercode,tags,remarks

      let pid = req.query.pid;
      let name = req.query.name;
      let sid = req.query.sid;
      let order = req.query.order;
      let usercode = req.query.usercode;
      let tags = req.query.tags;
      let remarks = req.query.remarks;

      if (typeof pid === 'undefined' || typeof name === 'undefined' || typeof sid === 'undefined') {
        ret = '#error#缺少参数';
      } else {
        if (typeof order === 'undefined')
          order = '';
        if (typeof usercode === 'undefined')
          usercode = '';
        if (typeof tags === 'undefined')
          tags = '';
        if (typeof remarks === 'undefined')
          remarks = '';

        ret = yield categorieCore.copy(pid, name, sid, username, order, usercode, tags, remarks);
      }
    }
  }).then(() => {
    res.send(ret);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  });

});

module.exports = router;