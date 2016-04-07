var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');


exports.authenticate = function(password,callback){
    var admin = {
        password: password  
    };
    Admin.findOne(admin,function(err,admin){
        if(admin){
            callback(true,admin);
        }else{
            callback(false,null);
        }
    });
};


exports.updatePassword = function(newPassword,callback){
    var data = {
        password: newPassword 
    };
    Admin.update({},{'$set':data},callback)     
};

exports.getCurrentSettings = function(callback){
    Admin.findOne({},function(err,admin){
        callback(admin.currentSemester,admin.currentMode);
    });
};

exports.getCurrentMode = function(callback){
    Admin.findOne({},function(err,admin){
        callback(admin.currentMode);
    });
};

exports.getCurrentSemester = function(callback){
    Admin.findOne({},function(err,admin){
        callback(admin.currentSemester);
    });
};

exports.updateSemester = function(semester,callback){
    // var data = {
    //     currentSemester : semester,
    //     currentMode: 'SetSlots'
    // };
    var data = {
        currentSemester: semester
    }
    Admin.update({},{'$set':data},callback);
};

exports.updateCurrentMode = function(currentMode,callback){
    var data = {
        currentMode: currentMode
    };
    Admin.update({},{'$set':data},callback);
};

exports.updateCurrentModeAndDetails = function(currentMode,roundNum,details,callback){
    var data = {};
    data['round' + roundNum + 'Details'] = details;
    data.currentMode = currentMode;
    Admin.update({},{'$set':data},callback);
};

exports.updateCurrentModeAppendDetails = function(currentMode,roundNum,details,callback){
    Admin.findOne({},function(err,admin){
        var data = {};
        var oldDetails = admin['round' + roundNum + 'Details'];
        data['round' + roundNum + 'Details'] = oldDetails + '\n' + details;
        data.currentMode = currentMode;
        Admin.update({},{'$set':data},callback);
    });
};


exports.getRoundDetails = function(roundNum,callback){
    Admin.findOne({},function(err,admin){
        callback(admin['round'+roundNum+'Details']);
    });
};
