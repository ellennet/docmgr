var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('./modules/config');

//路由相关
var routes = require('./routes/index');
var users = require('./routes/users');
var files = require('./routes/files');
var filesQuery = require('./routes/filesQuery');
var categorie = require('./routes/categorie');
var categorieQuery = require('./routes/categorieQuery');
var auth = require('./routes/auth');
var process = require('./routes/process');
var view = require('./routes/view');
var access = require('./routes/access');


//全局变量
global.tokenServer = config.tokenServer; //token服务
global.userServer = config.userServer; //用户服务
global.serviceId = config.serviceId; //本服务ID
global.servicePassword = config.servicePassword; //本服务密码

var app = express();

//设置跨域访问
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods','*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Request-Headers', '*');
  res.header('Access-Control-Allow-Credentials', true);

  //res.header('Access-Control-Allow-Methods','PUT,POST,GET,DELETE,OPTIONS');
  res.header('X-Powered-By','zhb Doc Server');
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

//set to ejs
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/doc', express.static('doc/skdocmgr'));

//登陆用session处理
app.use(session({ 
  secret: 'skdocmgr', 
  saveUninitialized: true,
  resave: false,
  cookie: { maxAge: 7200000 }
}));

app.use('/', routes);
app.use('/users', users); //用户验证
app.use('/process', process); //自身处理程序
app.use('/view', view); //在线预览

//服务接口
app.use('/files', files); //文件服务
app.use('/filesQuery', filesQuery); //文件查询服务
app.use('/categorie', categorie); //目录服务
app.use('/categorieQuery', categorieQuery); //目录查询服务
app.use('/auth', auth); //权限服务
app.use('/access', access); //访问鉴权

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;