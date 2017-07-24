
var tree; //tree的对象
var addType = -1;//0:同级项 1:子项

var baseUrl = 'http://localhost:3010';
var serviceUrl = 'http://localhost:3010';

//load tree
tree = new dhtmlXTreeObject("treebox", "100%", "100%", 0);
tree.setSkin('dhx_skyblue');
tree.setImagePath('../dhtmlx/codebase/imgs/dhxtree_skyblue/');
//tree.enableDragAndDrop(true);
//tree.setDragBehavior("complex");

tree.attachEvent("onClick", function (id) {
  selectTreeNode(id);
});

var treeUrl = baseUrl + '/process?action=getroot';

tree.loadXML(treeUrl, function () {
  //tree.setDragHandler(tondrag);
}); 

//删除文件
function deleteFile(id){
  if(confirm('确定要删除文件？')){
    $.ajax({
      url: serviceUrl + '/files/'+id,
      type: 'DELETE',
      dataType: 'html',
      data: {},
        headers: {
          '_token':_token
        },       
      success: function(data, textStatus, xhr) {
        if(data=='#ok#'){
          //table中移除
          $('tr[id='+id+']').remove();
          //window.location.reload();
        }
      },
      error: function(xhr, textStatus, errorThrown) {                
        alert('删除错误');
      }
    });    
  }
}

//移动文件
function moveFile(id){
  //id:文件id
  var cid = prompt('目标目录ID',''); //目录id
  if(cid!=''){
    $.ajax({
      url: serviceUrl + '/files?fid='+id+'&cid='+cid,
      type: 'PUT',
      dataType: 'html',
      data: {},
        headers: {
          '_token':_token
        },       
      success: function(data, textStatus, xhr) {
        if(data=='#ok#'){
          window.location.reload();
        }
      },
      error: function(xhr, textStatus, errorThrown) {                
        alert('移动错误');
      }
    });                
  }  
}

//上传文件
function uploadFile() {
  var id = tree.getSelectedItemId(); //选中目录的id
  if (id == ''){
    alert('请选择目录');
    return;
  }

  //表单提交的url添加一个token
  var url = serviceUrl + '/files?_token='+_token;
  $('#formUpload').attr('action',url);
  $('#cid').val(id); //目录id
      
  $("#formUpload").ajaxSubmit({
    type:'post',
    url:url,
    success:function(data){      
      selectTreeNode(id);
    },
    error:function(XmlHttpRequest,textStatus,errorThrown){
      selectTreeNode(id);
    }
  });  

}
  
//添加一个目录
function addCategorie() {

  var id = tree.getSelectedItemId(); //选中目录的id
  if (id == '') return;

  var parent;

  if (addType == 1) {
      parent = id;
  }
  if (addType == 0) {
      //得到父目录
      parent = tree.getParentId(id);
  }
      
  if (parent == 0) {
      parent = null;
  }

  var cname = $('#name').val(); //目录名称		    
  var tags = $('#tags').val(); //tags
  var remarks = $('#remarks').val(); //remarks

  $.ajax({
    url: serviceUrl + '/categorie',
    type: 'post',
    dataType: 'html',
    data: { 
      name: cname,
      tags: tags,
      remarks: remarks,
      parent: parent
      },
    headers: {
      '_token':_token
    },            
    success: function (data, textStatus, xhr) {      
      location.replace(location.href);
    },
    error: function (xhr, textStatus, errorThrown) {
      alert('error');
    }
  });
}

//选中一个目录
function selectTreeNode(id){
  $('#spanCId').html(id);
  
  //id:目录id
  $('#dataTbody').empty();
  var isLoad = tree.getUserData(id, 'isLoad');
  if (!isLoad) {
    //get child
    $.ajax({
      url: serviceUrl + '/categorie',
      type: 'GET',
      dataType: 'json',
      data: {pid:id},
      cache: false,
      headers: {
        '_token':_token
      },          
      success: function (data, textStatus, xhr) {

        $.each(data, function (n, value) {
          var fId = value.id;
          var fc = value.filecount;
          var text = value.name + '('+fc+')';
          tree.insertNewItem(id, fId, text, 0, "folderClosed.gif", "folderOpen.gif", "folderClosed.gif");
        });
        tree.setUserData(id, 'isLoad', true);
      },
      error: function (xhr, textStatus, errorThrown) {
        alert('error');
      }
    });
  }

  //load document            
  $.ajax({
    url: serviceUrl + '/files',
    type: 'GET',
    dataType: 'json',
    data: { cid: id },
    cache: false,
    headers: {
      '_token':_token
    },          
    success: function (data, textStatus, xhr) {
      if (data.length > 0) {
        //每个data都附加一个token对象
        $.each(data, function (n, value) {
          value.token = _token;
        });
                    
        $("#trTemplate").tmpl(data).appendTo("#dataTbody");
      }
    },
    error: function (xhr, textStatus, errorThrown) {
      alert('error');
    }
  });  
}

              
  //目录拖拽、
  //id被移动目录 id2目标目录
  function tondrag(id,id2){
    var sText = tree.getItemText(id);
    var tText = tree.getItemText(id2);
    if(confirm('确定要把“'+sText+'”移动到“'+tText+'”下？')){
      
      //:/categorie?sid=?&tid=? header _token
      $.ajax({
        url: serviceUrl + '/categorie?sid='+id+'&tid='+id2,
        type: 'PUT',
        dataType: 'html',
        data: { },
        cache: false,
        headers: {
          '_token':_token
        },          
        success: function (data, textStatus, xhr) {
          if(data=='#ok#'){
            return true;
            //location.replace(location.href);
          }
          else{
            alert(data);
            return false;
          }
        },
        error: function (xhr, textStatus, errorThrown) {
          alert('error');
          return false;
        }
      });      
                  
      
    }
    else{
      return false;
    }            
  };  

  //dialog
  var addCategorieDialog = $("#dialogAddCategorie").dialog({
    autoOpen: false,
    height: 300,
    width: 300,
    modal: true,
    buttons: {
        "添加": addCategorie         
    },
    close: function () {
        addType = -1;
        addCategorieDialog.dialog("close");
    }
  });
  
  var uploadDialog = $('#diaglogUpload').dialog({
    autoOpen: false,
    height: 500,
    width: 500,
    modal: true,
    buttons: {
      "上传": uploadFile         
    },
    close: function () {
      uploadDialog.dialog("close");
    }    
  });

  //button handle
  $('#btnUpload').button().on("click", function () {
    //上传文件
    var id = tree.getSelectedItemId(); //选中目录的id
    var text = tree.getSelectedItemText(); //选中目录的text
    $('#spanUploadInfo').html('目标目录：'+text+'('+id+')');
    
    uploadDialog.dialog("open");
  });
  
  $("#addChild").button().on("click", function () {
    //子项
    addType = 1;
    addCategorieDialog.dialog("open");
  });
  $("#addSame").button().on("click", function () {
    //同级项
    addType = 0;
    addCategorieDialog.dialog("open");
  });
  $("#delItem").button().on("click", function () {
    //删除项
    var id = tree.getSelectedItemId(); //选中目录的id
    if (id == '') return;      
    
    if(confirm('确定要删除目录？')){
      
      $.ajax({
        url: serviceUrl + '/categorie/'+id,
        type: 'delete',
        dataType: 'html',
        data: { },
        headers: {
          '_token':_token
        },             
        success: function (data, textStatus, xhr) {
          if(data=='#ok#')
            //location.replace(location.href);
            tree.deleteItem(id,true);            
          else
            alert(data);              
        },
        error: function (xhr, textStatus, errorThrown) {
          alert('error');
        }
      });        
      
    }
  });  
                  

 