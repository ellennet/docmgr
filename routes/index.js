let express = require('express');
let router = express.Router();

let co = require('co');

let access = require('../modules/access');
let self = require('../modules/self');

let appId = require('../modules/config').appIds[0];

/* GET home page. */
router.get('/', (req, res, next) => {
  let _token;

  let user = req.session.user;
  if (typeof user === 'undefined') {
    res.redirect('users');
  } else {
    co(function* () {
      //get token
      _token = yield access.generateToken(appId, user, req.ip);
    }).then(() => {
      res.render('dashboard', {
        title: 'SkDocMgr',
        user: user,
        token: _token
      });

    }, (err) => {
      throw err;
    }); //end co  
  }
});

//file manage
router.get('/fm', (req, res, next) => {
  let user = req.session.user;
  if (typeof user === 'undefined') {
    res.redirect('users');
  } else {
    let _token;
    co(function* () {
      //get token
      _token = yield access.generateToken(appId, 'admin', req.ip);
    }).then(() => {
      res.render('fm', {
        title: 'SkDocMgr',
        user: user,
        token: _token
      });
    }, (err) => {
      throw err;
    }); //end co     
  }
});

//获取树控件的目录
router.get('/fm/getroot/:token', (req, res, next) => {
  let token = req.params.token; //token
  let loginObj;
  let selectId = req.query.selectId;
  if (token === undefined) {
    res.send('#error#need token');
  } else {
    let obj;
    co(function* () {
      loginObj = yield access.verifyToken(token);

      if (selectId === '#') {
        obj = yield self.getTreeRoot();

      } else {
        obj = yield self.getTreeNode(selectId);
      }
    }).then(() => {
      let user = req.session.user;
      if (loginObj.user === user) {
        res.send(obj);
      } else {
        res.send('#error#user error');
      }
    }, (err) => {
      res.send('#error#' + err);
    }); //end co  
  }
});

//根据目录ID获取子目录 local
router.get('/fm/getnode/:id', (req, res, next) => {
  let token = req.get('token'); //token
  let loginObj;
  let pid = req.params.id; //父节点ID

  if (token === undefined) {
    res.send('#error#need token');
  } else {
    let user = req.session.user;
    let nodeJson;
    co(function* () {
      loginObj = yield access.verifyToken(token);
      nodeJson = yield self.getTreeNode(pid);
    }).then(() => {
      if (loginObj.user === user) {
        if (pid === undefined) {
          res.send('#error#need pid');
        } else {
          res.send(nodeJson);
        }
      } else {
        res.send('#error#user error');
      }
    }, (err) => {
      res.send('#error#' + err);
    }); //end co  
  }
});

//获取文件 local
router.get('/fm/getfile/:id', (req, res, next) => {
  let token = req.get('token'); //token
  let cid = req.params.id; //目录ID

  let files;
  let loginObj;

  if (cid === undefined || token === undefined) {
    res.send('#error#need cid and token');
  } else {
    co(function* () {
      loginObj = yield access.verifyToken(token);
      files = yield self.getFileInNode(cid, token);
    }).then(() => {
      let user = req.session.user;
      if (loginObj.user === user) {
        res.send(files);
      } else {
        res.send('#error#user error');
      }
    }, (err) => {
      throw err;
    }); //end co 
  }
});


module.exports = router;