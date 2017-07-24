let express = require('express');
let router = express.Router();

let co = require('co');
let access = require('../modules/access');

//根据appid获取appkey
//获取token
router.get('/:appid', (req, res, next) => {

  if(req.hostname!=='localhost' && req.hostname!=='127.0.0.1'){
    res.send('none');
  }

  let appId = req.params.appid;

  if (appId === undefined) {
    res.send('#error#need appid');
  }

  let appKey;
  co(function* () {
    appKey = yield access.generateAppKey(appId);   
  }).then(() => {
    res.send(appKey);
  }, (err) => {
    res.send('#error#' + err);
  });

});

//获取token
router.get('/', (req, res, next) => {

  let appId = req.get('_appid');
  let user = req.get('_user');
  let sign = req.get('_sign');

  if (appId === undefined || user === undefined || sign === undefined) {

    res.send('#error#need auth head');
  }

  //let userDecode = decodeURIComponent(user);

  let token;
  co(function* () {
    yield access.checkAppId(appId); //验证appid
    yield access.checkSign(appId, user, sign); //验证签名
    token = yield access.generateToken(appId, user, req.ip); //生成token
    //生成token    
  }).then(() => {
    res.send(token);
  }, (err) => {
    res.send('#error#' + err);
  });

});

router.post('/', (req, res, next) => {

  //header附带的token
  let _token = req.get('_token');
  if (typeof _token === 'undefined') {
    _token = req.query._token; //如果header中没有token ，尝试从查询串中找
  }

  let ret;
  co(function* () {
    ret = yield access.verifyToken(_token, req.ip); //验证token
  }).then(() => {
    res.send(ret);
  }, (err) => {
    res.send('#error#' + err);
  });

}); //end post

module.exports = router;