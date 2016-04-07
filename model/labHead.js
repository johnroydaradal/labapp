var mongoose = require('mongoose');
var LabHead = mongoose.model('LabHead');


exports.authenticate = function(lab,password,callback){
    var labHead = {
        lab : lab,
        password: password  
    };
    LabHead.findOne(labHead,function(err,labHead){
        if(labHead){
            callback(true,labHead);
        }else{
            callback(false,null);
        }
    });
};


exports.updatePassword = function(lab,newPassword,callback){
    var data = {
        password: newPassword 
    };
    LabHead.update({lab: lab},{'$set':data},callback);  
};