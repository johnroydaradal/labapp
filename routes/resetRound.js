var studentGroupModel = require('../model/studentGroup'),
    adminModel = require('../model/admin'),
    labSettingModel = require('../model/labSetting');

if(!studentGroupModel.USE_DB){
    var labSettingModel = require('../testModel/labSetting');
}

var resetRound = function(currentSemester,roundNum,req,res){
/* 
Common
    Admin.currentMode = 'Rank' + roundNum
    LabSetting.currentMode = 'Round' + roundNum + 'Rank' / Round3Pick
    LabSetting.round(roundNum)Details = ''
    LabSetting.round(roundNum after)Details = ''
    LabSetting.assigned[roundNum] = []
    LabSetting.assigned[roundNum after] = []
    LabSetting.rerankNeeded = 0
    LabSetting.extra = []

*/
    var newMode = 'Rank' + roundNum;
    adminModel.updateCurrentMode(newMode,function(err){
        if(err){
            console.log(err);
            return res.send("ERROR");
        }
        labSettingModel.resetRound(currentSemester,roundNum,function(err){
            if(err){
                console.log(err);
                return res.send("ERROR");
            }else{
                console.log("Successfully reset Round " + roundNum + ".");
                return res.send("OK");
            }
        })
    });
};


exports.round1 = function(req,res){
/*
For Round 1
    LabSetting.rankCount = 0
    LabSetting.lacking = 0
    LabSetting.ranking = []
*/
    adminModel.getCurrentSemester(function(currentSemester){
        labSettingModel.resetRound1(currentSemester,function(err){
            resetRound(currentSemester,'1',req,res);    
        })
    });

};

exports.round2 = function(req,res){
/*
For Round 2
    LabSetting.lacking = totalSlots - numOfStudents in assigned[1]
    LabSetting.ranking = oldRanking up to rankCount (erase Round 2 rankings)
*/
    

    adminModel.getCurrentSemester(function(currentSemester){
        studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
            var groupCount = {};
            studentGroups.forEach(function(group){
                groupCount[group.number] = group.names.length;
            });
            var limit = studentGroupModel.labs.length;
            labSettingModel.resetRound2(currentSemester,limit,groupCount,function(err){
                resetRound(currentSemester,'2',req,res);  
            });
        });
    });

};

exports.round3 = function(req,res){
    adminModel.getCurrentSemester(function(currentSemester){
        resetRound(currentSemester,'3',req,res);
    });

};