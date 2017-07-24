let solr = require('solr-client');
let fs = require('fs');

exports.addDoc = (w) => {

  return new Promise((resolve, reject) => {
    try {
      // let solrClient = require("solr-client"),
      // client = solrClient.createClient({
      //   "host": "127.0.0.1",
      //   "port": 8983,
      //   "path": "/solr",
      //   "core": "new_core"
      // });      
      // 
      // 
      // let query2 = client.createQuery()
      //           .q({description_t : '高危'})
      //           .start(0)
      //           .rows(10);
      // client.search(query2,(err,obj)=>{
      //   if(err){
      //     console.log(err);
      //   }else{
      //     console.log(obj);
      //   }
      // });             

      // client.autoCommit = true;
      // 
      // let doc = {
      //     id : 12345,
      //     title_t : "Title 123",
      //     description_t : words
      // }      
      // 
      // client.add(doc,(err,obj)=>{
      //   if(err){
      //       console.log(err);
      //   }else{
      //       console.log(obj);
      //   }
      // });    
    } catch (error) {
      console.error(error);
    }
  });
};


// Error handler
function onerror(err) {
  console.error(err);
}