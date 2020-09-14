let express = require('express');
let router = express.Router();

let co = require('co');
let token = require('../modules/token');

let authCore = require('../modules/authCore');
let logCore = require('../modules/logCore');
let config = require('../modules/config');

//验证权限
//:/auth?type=?&id=? get header _token
//返回：{auth:bool,rw:r or w or d} //read write download
router.get('/', (req, res, next) => {
  let _token = req.get('_token'); //附带的token
  let username;

  let type = req.query.type; //对象类型
  let id = req.query.id; //对象id

  let result;

  co(function* () {
    username = yield token.ValidateToken(_token);
    result = yield authCore.checkAuth(type, id, username);
  }).then(() => {
    res.json(result);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  });
});

//根据对象ID得到权限信息 need admin
//:/auth/type/id get header _token
router.get('/:type/:id', (req, res, next) => {
  let id = req.params.id;
  let type = req.params.type;
  let username;
  let doc;
  let _token = req.get('_token'); //附带的token  
  let adminUser = config.authAdminUser;

  co(function* () {
    username = yield token.ValidateToken(_token);

    if (adminUser.indexOf(username) === -1) {
      //无权限
      doc = '{res:403}';
    } else {
      doc = yield authCore.getAuth(type, id);
    }
  }).then(() => {
    res.json(doc);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  });
});

//创建或修改权限 need admin
//:/auth post header _token
//body type,id,r(array),w(array),d(array)
router.post('/', (req, res, next) => {
  let _token = req.get('_token'); //附带的token
  let username;

  let type = req.body.type;
  let id = req.body.id;

  if (typeof type === 'undefined')
    type = '';
  if (typeof id === 'undefined')
    id = '';

  let r = req.body.r;
  let w = req.body.w;
  let d = req.body.d;

  if (typeof r === 'undefined' || r === null)
    r = [];
  if (typeof w === 'undefined' || w === null)
    w = [];
  if (typeof d === 'undefined' || d === null)
    d = [];

  let adminUser = config.authAdminUser;
  let result;

  co(function* () {
    username = yield token.ValidateToken(_token);

    if (adminUser.indexOf(username) === -1) {
      //无权限
      result = '#403#';
    } else {
      yield authCore.createOrUpdateAuth(type, id, r, w, d);
      result = '#ok#';
    }
  }).then(() => {
    res.send(result);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  });
});

//删除权限 need admin
//:/auth/type/id delete header _token
router.delete('/:type/:id', (req, res) => {
  let id = req.params.id;
  let type = req.params.type;

  let username;
  let _token = req.get('_token'); //附带的token

  let adminUser = config.authAdminUser;
  let result;

  co(function* () {
    username = yield token.ValidateToken(_token);

    if (adminUser.indexOf(username) === -1) {
      //无权限
      result = '#403#';
    } else {
      yield authCore.removeAuth(type, id);
      result = '#ok#';
    }
  }).then(() => {
    res.send(result);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  });
});

module.exports = router;