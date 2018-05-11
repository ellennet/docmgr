# SkDocMgr文档服务
## 系统说明
### 1、基础框架
系统是基于nodeexpres构建的api服务。所有的api都基于http。默认服务端口是3010。调用API前必须从API认证服务器中获取访问token。
### 2、数据存储
数据库存储采用了mongodb3.2，文件存储使用了mongodb的GridFS。共有2个集合：categories、fs。categories存放目录结构信息、fs存放文件信息。目录结构采用改过的祖先数组数据结构模式。
## 使用说明（示例代码为C#，采用Restsharp库。返回的json对象可以使用VS中的选择性粘贴自动创建模型类。）
### 从服务器中得到授权token。
```csharp
！！appId、appKey、签名算法是验证合法性的唯一，请妥善保存。

//请求token
string appId = "";  //填入appId
string appKey = ""; //填入appKey
string username = System.Web.HttpUtility.UrlEncode("zhuhongbo", Encoding.UTF8); //登录用户的用户名
string sign = HMACSHA256Encode(username, appId, appKey);
var request1 = new RestRequest("access", Method.GET);
request1.AddHeader("_appid", appId);
request1.AddHeader("_user", username);
request1.AddHeader("_sign", sign);
var response1 = client1.Execute(request1);
var token = response1.Content;

//签名算法
public static string HMACSHA256Encode(string username, string appId, string appKey)
{
    //hmac的key
    byte[] key = Encoding.Default.GetBytes(appKey);

    string data = string.Format("zhb-{0}${1}${2}", username, appId, appKey);
    byte[] StrRes = Encoding.Default.GetBytes(data);

    byte[] tmpByte;
    HMACSHA256 hmac256 = new HMACSHA256(key);
    tmpByte = hmac256.ComputeHash(StrRes);
    hmac256.Clear();

    StringBuilder EnText = new StringBuilder();
    foreach (byte iByte in tmpByte)
    {
        EnText.AppendFormat("{0:x2}", iByte);
    }

    return EnText.ToString();
}
```
### 得到所有根目录
```
var client = new RestClient("http://localhost:3010"); //服务器地址            
var request = new RestRequest("categorie", Method.GET);
request.AddHeader("_token", token);
var response = client.Execute(request);
string ret = response.Content;
```
### 得到子目录（只取一层）
```
var request = new RestRequest("categorie?pid=?", Method.GET); //pid为父目录id
```
### 得到目录的信息
```
var request = new RestRequest("categorie/id", Method.GET); //id为目录的id
```
### 根据目录层级及名称获取目录信息
```
//举例：项目文件/直管部/华东医院扩建新楼工程
var request = new RestRequest("categorieQuery", Method.GET);
request1.AddHeader("_token", token);
request1.AddQueryParameter("action", "getctg");
request1.AddQueryParameter("level", "3");
request1.AddQueryParameter("name", "华东医院扩建新楼工程");
```
### 得到目录下所有子目录（遍历）
```
var request = new RestRequest("categorieQuery?action=getdeep&id=", Method.GET); 
```
### 复制目录结构（遍历）
```
//pid：复制到哪个目录的ID,
//name：新目录名称
//sid：从哪个目录复制（只复制这个目录的所有子目录）
//order
//usercode
//tags
//remarks
string query = "pid=&name=&sid=&&order=&usercode=&tags=&remarks=";
var request = new RestRequest("categorieQuery?action=copy&" + query, Method.GET); //返回新目录的ID
```
### 同一级是否存在同名目录
```csharp
//如果没有重名返回"false"字符串，如果有重名返回已有目录的ID
var request = new RestRequest("categorieQuery?action=duplicate&parent=&name=", Method.GET); 
//parent为父目录ID，name为目录名称。注意：系统是允许重名目录存在。
```
### 创建目录
```
Categorie categorie1 = new Categorie();
var client1 = new RestClient("http://localhost:3010"); //doc服务器地址            
var request1 = new RestRequest("categorie", Method.POST) { RequestFormat = DataFormat.Json };
request1.AddHeader("_token", token);
request1.AddBody(categorie);
var response1 = client1.Execute(request1);
string ret = response1.Content; //返回目录的ID

public class Categorie
{
    /// <summary>
    /// 目录名
    /// </summary>
    public string name { get; set; }
    /// <summary>
    /// 父目录ID
    /// </summary>
    public string parent { get; set; }
    /// <summary>
    /// tags
    /// </summary>
    public string tags { get; set; }
    /// <summary>
    /// 备注
    /// </summary>
    public string remarks { get; set; }
    /// <summary>
    /// 排序号
    /// </summary>
    public string order { get; set; }
    /// <summary>
    /// usercode 三凯专用
    /// </summary>
    public string UserCode { get; set; }
}
```
### 删除目录
```
var request = new RestRequest("categorie/id", Method.DELETE); //id为目录id
```
### 删除目录（遍历）
```
//删除所有子目录及文件
var request = new RestRequest("categorie?action=fdelete&id=", Method.DELETE); //id为目录id
```
### 修改目录名称
```
var request = new RestRequest("categorie/id?name=?", Method.PUT); //id为目标目录id name为新的目录名称
```
### 移动目录
TODO
### 得到某个目录下的所有文件（不包括子目录）
```
var request = new RestRequest("files?cid=", Method.GET); //cid为目录的id
```
### 遍历得到某个目录下的所有目录
```
var request = new RestRequest("categorieQuery?action=getdeep&id=", Method.GET); //id为目录的id
request.AddHeader("_token", token);
response = client.Execute(request);
string ret = response.Content;
var c = Newtonsoft.Json.JsonConvert.DeserializeObject<doc>(ret);

public class doc
{
    public string _id { get; set; }
    public string id { get; set; }
    public string name { get; set; }
    public string cUser { get; set; }
    public string uUser { get; set; }
    public DateTime cTime { get; set; }
    public DateTime uTime { get; set; }
    public string remarks { get; set; }
    public string tags { get; set; }
    public string ctype { get; set; }
    public string parent { get; set; }
    public string[] ancestors { get; set; }
    public bool children { get; set; }
    public string order { get; set; }
    public string UserCode { get; set; }
    public int filecount { get; set; }
    public List<doc> childDocs { get; set; }
}
```
### 得到某个目录及子目录下的所有文件
```
var request = new RestRequest("filesQuery?action=listfileroot&cid=", Method.GET); //cid为目录的id
```
### 查询某个目录下是否有同名文件
```
var request = new RestRequest("filesQuery?action=duplicate&cid=&name=", Method.GET); //cid为目录的id，name为文件名称
```
### 查询文件
```
var request = new RestRequest("filesQuery?action=search&q=?", Method.GET); //q为关键字
```
### 得到文件（下载文件）
```
var request = new RestRequest("files/id", Method.GET); //id为文件的id
```
### 得到文件（流）
```
var request = new RestRequest("files/stream/id", Method.GET); //id为文件的id
```
### 得到文件信息
```
var request = new RestRequest("files/info/id", Method.GET); //id为文件的id
```
### 移动文件
```
var request = new RestRequest("files?fid=&cid=", Method.PUT); //fid为文件的id，cid为目标目录id
```
### 删除文件
```
var request = new RestRequest("files/id", Method.DELETE); //id为文件id
```
### 上传文件
```
var client = new RestClient("http://localhost:3010"); //doc服务器地址
var request = new RestRequest("files", Method.POST);            
request.AddHeader("_token", token);
request.AddParameter("cid", file.cid);
request.AddParameter("remarks", file.remarks);
request.AddParameter("tags", file.tags);
request.AddFile("file1", file.path); //file字段名称    
var response = client.Execute(request);
string ret = response.Content; //返回文件ID

public class Files
{
    /// <summary>
    /// 目录ID
    /// </summary>
    public string cid { get; set; }
    /// <summary>
    /// 备注
    /// </summary>
    public string remarks { get; set; }
    /// <summary>
    /// 标签
    /// </summary>
    public string tags { get; set; }
    /// <summary>
    /// 文件路径
    /// </summary>
    public string path { get; set; }
}
```
