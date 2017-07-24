let tika = require('tika');

//得到文件contentType
exports.getType = (path) => {
  return new Promise((resolve, reject) => {
    tika.type(path, (err, contentType) => {
      if (err)
        reject(err);
      else
        resolve(contentType);
    });
  });
};

//解析文件内容
exports.text = (path) => {
  return new Promise((resolve, reject) => {
    let options = {
      //contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    tika.text(path, options, (err, text) => {
      if (err)
        reject(err);
      else
        resolve(text);
    });
  });
};

//临时放这里
exports.save = (fileId, words) => {
  return new Promise((resolve, reject) => {
    try {
      let searchIndex = global.db.collection('searchIndex');

      //fileId,words
      let obj = {};
      obj.fileId = fileId;
      obj.words = words;

      searchIndex.insertOne(obj).then((r) => {
        resolve(r);
      });
    } catch (error) {
      reject(error);
    }
  });
};