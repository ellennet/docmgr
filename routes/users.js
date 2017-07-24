let express = require('express');
let router = express.Router();
let log = require('../modules/logCore');

/* GET users listing. */
router.get('/', (req, res, next) => {

  let user = req.session.user;
  let action = req.query.action;

  if (action === 'logout') {
    req.session.destroy((err) => {
      res.render('users', {
        msg: ''
      });
    });
  } else {
    if (typeof user === 'undefined') {
      res.render('users', {
        msg: ''
      });
    } else {
      res.redirect('/');
    }
  }
});

//login
router.post('/', (req, res, next) => {

  let username = req.body.username;
  let password = req.body.password;

  if (username === 'admin' && password === 'Sk63214501') {

    log.info(username, 'login');

    let sess = req.session;
    sess.user = 'admin';
    res.redirect('/');
  } else {
    res.render('users', {
      msg: '验证出错'
    });
  }
});

module.exports = router;