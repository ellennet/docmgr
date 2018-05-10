//文件上传路径 [请勿修改]
exports.uploadDir = './doc/SkDocMgr/';

//path中的上传路径 用来获取文件名 [请勿修改]
exports.uploadDirInPath = 'doc\\SkDocMgr\\';

//mongodb 服务地址
//exports.mongodbUri = 'mongodb://test:test@localhost/skdocmgr';
exports.mongodbUri = 'mongodb://localhost/skdocmgr-gmnn';

//是否带知识库系统
exports.hasKb = false;

//是否保留上传的源文件
exports.KeepSourceFile = true;

//文档转pdf服务地址
exports.TranPDFHost = '';

//权限操作用户名单
exports.authAdminUser = ['admin'];

//可用appId [暂时不支持多个]
exports.appIds = ['gmnn'];

//启用oss存储
exports.oss = false;

//文档物理保存路径 [参照第一及第二项中的参数修改]
exports.DocDiskPath = 'D:\\Code\\NodeApp\\DocMgr\\doc\\SkDocMgr\\';