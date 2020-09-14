//文件上传路径 [请勿修改]
exports.uploadDir = './doc/SkDocMgr/';

//path中的上传路径 用来获取文件名 [请勿修改]
exports.uploadDirInPath = 'doc/SkDocMgr/';

//mongodb 服务地址
exports.mongodbUri = global.mongourl;
//exports.mongodbUri = 'mongodb://bos:Bos52524567@52.130.72.55/bos';

//是否保留上传的源文件
exports.KeepSourceFile = true;

//文档转pdf服务地址
exports.TranPDFHost = '';

//权限操作用户名单
exports.authAdminUser = ['admin'];

//可用appId [暂时不支持多个]
exports.appIds = global.appid;

//文档物理保存路径 [请勿修改]
exports.DocDiskPath = '/data/doc/SkDocMgr/';

//启用oss存储
exports.oss = true;
//minio配置
var minioConfig = {
    endPoint: global.MINIO_HOST,
    port: global.MINIO_PORT * 1,
    useSSL: false,
    accessKey: global.MINIO_AK,
    secretKey: global.MINIO_SK
};
exports.minioConfig = minioConfig;
exports.minioBucket = global.MINIO_BUCKET;

//bimviz配置（弃用）
exports.BimVizUrl = 'http://10.243.11.4:7004'; //服务地址
exports.DevUser = 'xdds'; //用户名
exports.DevKey = '408456c2-a2b8-4f8c-93bc-33cbdc0e92a6'; //用户key