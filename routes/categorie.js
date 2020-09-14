let express = require('express');
let router = express.Router();

let co = require('co');
let categorieCore = require('../modules/categorieCore');
let logCore = require('../modules/logCore');
let token = require('../modules/token');

//根据父ID得到所有子目录，如果不传pid则得到所有根目录 with auth
//:/categorie?pid=id get header _token
router.get('/', (req, res, next) => {
  let _token = req.get('_token'); //附带的token
  let username;
  let id = req.query.pid; //父id
  let docs;

  co(function* () {

    username = yield token.ValidateToken(_token);

    if (typeof id === 'undefined') {
      //得到所有根目录
      docs = yield categorieCore.getRoot();
    } else {
      //根据父id得到所有子目录
      docs = yield categorieCore.getChildById(id);
    }
  }).then(() => {
    console.log('route get doc(' + docs.length + ');go send');
    res.json(docs);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  });
});

//内部调用
//重置目录下的文件个数
router.get('/private/reset/fc/:id', (req, res, next) => {

  let categories = global.db.collection('categories');
  let fsMongo = global.db.collection('fs');
  let fileCount = 0;
  let id = req.params.id;

  fsMongo.find({
    'ancestors': id
  }).toArray((err, docs) => {
    if (err) {
      console.log(err);
    } else {
      fileCount = docs.length;
      categories.findOneAndUpdate({
          'id': id
        }, {
          $set: {
            'filecount': fileCount
          }
        }, {
          returnOriginal: false,
          upsert: true
        },
        (err, r) => {});
    }
  }); //end list 
});

//根据ID得到目录 with auth
//:/categorie/id get header _token
router.get('/:id', (req, res, next) => {

  let id = req.params.id;
  let doc;
  let username;
  let _token = req.get('_token'); //附带的token

  co(function* () {
    username = yield token.ValidateToken(_token);
    doc = yield categorieCore.getById(id);
  }).then(() => {
    res.send(doc);
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  });

});

//创建目录
//:/categorie post header _token
//body: name,parent,tags,remarks,order
router.post('/', (req, res, next) => {

  let name = req.body.name; //目录名称
  let parent = req.body.parent; //父ID
  let tags = req.body.tags; //tags
  let remarks = req.body.remarks; //remarks  
  let order = req.body.order; //order

  //UserCode
  let UserCode = req.body.UserCode;

  let _token = req.get('_token');
  let username;

  if (typeof parent === 'undefined' || parent === '')
    parent = null;
  if (typeof tags === 'undefined')
    tags = '';
  if (typeof remarks === 'undefined')
    remarks = '';
  if (typeof order === 'undefined')
    order = '';

  //UserCode
  if (typeof UserCode === 'undefined')
    UserCode = '';

  if (typeof name === 'undefined') {
    res.send('#error#need name');
  } else {
    let doc;

    co(function* () {
      username = yield token.ValidateToken(_token);
      doc = yield categorieCore.createCategorie(name, parent, 'd', tags, remarks, username, order, UserCode);
    }).then(() => {
      res.send(doc); //返回新目录的id
    }, (err) => {
      logCore.error(username, err);
      res.send('#error#' + err);
    });
  }
});

//删除目录
//:/categorie/id delete header _token
router.delete('/:id', (req, res) => {
  let _token = req.get('_token'); //附带的token 
  let id = req.params.id;
  let username;

  co(function* () {
    username = yield token.ValidateToken(_token);
    yield categorieCore.deleteCategorie(id);
  }).then(() => {
    logCore.info(username, '删除目录' + id);
    res.send('#ok#');
  }, (err) => {
    logCore.error(username, err);
    res.send('#error#' + err);
  });
});

//删除目录及子目录与文件
//:/categorie?action=fdelete&id= delete header _token
router.delete('/', (req, res) => {
  let _token = req.get('_token'); //附带的token 

  let action = req.query.action; //删除操作标识
  let id = req.query.id; //目录id

  let username;

  if (typeof id === 'undefined' || typeof action === 'undefined') {
    res.send('#error#缺少参数');
  } else {
    co(function* () {
      username = yield token.ValidateToken(_token);

      if (action === 'fdelete') {
        yield categorieCore.deleteForce(id);
      }
    }).then(() => {
      logCore.info(username, '删除目录(递归)' + id);
      res.send('#ok#');
    }, (err) => {
      res.send('#error#' + err);
    });
  }
});

//修改目录内容(名称) todo
//:/categorie/id put header _token
router.put('/:id', (req, res) => {
  let _token = req.get('_token'); //附带的token 
  let id = req.params.id;
  let username;

  let name = req.query.name; //新目录名称

  co(function* () {
    username = yield token.ValidateToken(_token);
    yield categorieCore.updateCategorie(id, name, null, null, username);
  }).then(() => {
    res.send('#ok#');
  }, (err) => {
    res.send('#error#' + err);
  });


});

//移动目录
//:/categorie?sid=?&tid=? header _token
router.put('/', (req, res) => {
  //todo 暂时不支持有子目录的目录移动

  let _token = req.get('_token'); //附带的token 
  let sid = req.query.sid; //被移动目录
  let tid = req.query.tid; //目标目录
  let username;

  co(function* () {
    username = yield token.ValidateToken(_token);
    yield categorieCore.moveCategorie(sid, tid, username);
  }).then(() => {
    res.send('#ok#');
  }, (err) => {
    res.send('#error#' + err);
  });

});

module.exports = router;