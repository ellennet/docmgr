let crypto = require('crypto');

//sha1 
exports.Sha1 = (str) => {
  let hash = crypto.createHash('sha1');
  hash.update(str, 'utf8');
  return hash.digest('hex');
};

//sha256
exports.Sha256 = (str) => {
  let hash = crypto.createHash('sha256');
  hash.update(str, 'utf8');
  return hash.digest('hex');
};

//hmac256
exports.HmacSha256 = (str, key) => {
  let hash = crypto.createHmac('sha256', key);
  hash.update(str, 'utf8');
  return hash.digest('hex');
};

//加密
exports.Encryptor = (algorithm, key, buf) => {
  key = '34^4lJf6da@!#$';

  let encrypted = '';
  let cip = crypto.createCipher(algorithm, key);
  encrypted += cip.update(buf, 'binary', 'hex');
  encrypted += cip.final('hex');

  return encrypted;
};

//解密
exports.Decryptor = (algorithm, key, encrypted) => {
  try {
    key = '34^4lJf6da@!#$';

    let decrypted = '';
    let decipher = crypto.createDecipher(algorithm, key);
    decrypted += decipher.update(encrypted, 'hex', 'binary');
    decrypted += decipher.final('binary');

    return decrypted;
  } catch (error) {
    return 'error';
  }
};