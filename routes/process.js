let express = require('express');
let router = express.Router();

let co = require('co');
let fsCore = require('../modules/fsCore');
let token = require('../modules/token');

router.get('/', (req, res, next) => {
  let action = req.query.action;

  if (action === 'settranstatus') {
    //设置文旦转换状态
    //todo only local    

    let fid = req.query.fid;
    let status = req.query.status; //ok成功 err失败

    co(function* () {
      if (status === 'ok') {
        yield fsCore.SetTranStatus(fid, 2); //转换完成
      } else {
        yield fsCore.SetTranStatus(fid, -1); //错误
      }
    }).then(() => {
      res.send('ok');
    }, (err) => {
      res.send(err);
    });
  }

  if (action === 'gettoken') {
    //get token
    //todo only local                
    let _token;
    co(function* () {
      let username = req.session.user;
      _token = yield token.getToken(username);
    }).then(() => {
      res.send(_token);
    }, (err) => {
      res.send(err);
    });
  }
});

module.exports = router;