var mongoose = require('mongoose');
var LabSetting = mongoose.model('LabSetting');

exports.getLabSettings = function(semester,callback){
    var data = {
        semester: semester
    };
    LabSetting.find(data).sort({'lab':1}).exec(callback);
};

exports.getLabSetting = function(semester,lab,callback){
    var query = {
        semester: semester,
        lab: lab
    }; 
    LabSetting.findOne(query,callback);
};


exports.resetRequired = function(semester,callback){
    var query = {semester: semester};
    LabSetting.remove(query,callback);
};

exports.updateRequired = function(data,callback){
    var labSettings = [];
    var semester = data.currentSemester;
    for(var lab in data.required){
        labSettings.push({
            semester: semester,
            lab: lab,
            required: data.required[lab]
        });
    }
    LabSetting.create(labSettings,callback);  
};


exports.updateAdditional = function(data,callback){
    var query = {
        semester: data.semester,
        lab: data.lab
    };
    var updateData = {
        additional: data.additional  
    };
    
    LabSetting.update(query,{'$set': updateData}, callback); 
};



exports.addExtra = function(data,callback){
    var query = {
        semester: data.semester,
        lab: data.lab
    };
    var updateData = {
        extra: data.extra,
        currentMode: data.nextMode
    };
    LabSetting.update(query,{ '$set': updateData },callback); 
};
exports.addRanking = function(data,callback){
    var query = {
        semester: data.semester,
        lab: data.lab
    };
    var updateData = {
        ranking: {
            '$each' : data.ranking  
        }
    };
    var setData = {
        currentMode: data.nextMode  
    };
    if(data.currentRound == 'Round1'){
        LabSetting.findOne(query,function(err,labSetting){
            setData.rankCount = labSetting.rankCount + data.ranking.length;
            LabSetting.update(query,{ '$addToSet': updateData, '$set': setData },callback);        
        });
    }else{
        LabSetting.update(query,{ '$addToSet': updateData, '$set': setData },callback);    
    }
};

exports.getRankings = function(semester,callback){
    var data = {
        semester: semester
    };
    LabSetting.find(data).exec(function(err,labSettings){
        var rankings = {};
        if(err){
            callback(err,rankings);  
        }else{
            labSettings.forEach(function(labSetting){
                rankings[labSetting.lab] = labSetting.ranking; 
            });
            callback(null,rankings);
        }
    });
};

exports.getRoundRanking = function(semester,lab,round,callback){
    LabSetting.findOne({
        semester: semester,
        lab: lab
    },function(err,labSetting){
        var count = labSetting.ranking.length,
            rankCount = labSetting.rankCount;
        if(round == 1){
            callback(labSetting.ranking.splice(0,rankCount));
        }else{
            callback(labSetting.ranking.splice(rankCount,count));
        }
    });
};

exports.getTotalSlots = function(semester,callback){
    var data = {
        semester: semester
    };
    LabSetting.find(data).exec(function(err,labSettings){
        var totalSlots = {};
        if(err){
            callback(err,totalSlots);  
        }else{
            labSettings.forEach(function(labSetting){
                totalSlots[labSetting.lab] = labSetting.required + labSetting.additional; 
            });
            callback(null,totalSlots);
        }
    });
};
exports.getLackingData = function(semester,callback){
    // Used for Round 2
    var data = {
        semester: semester
    };
    LabSetting.find(data).exec(function(err,labSettings){
        var lackings = {},
            assignments = {},
            rankings = {};

        labSettings.forEach(function(s){
            lackings[s.lab] = s.lacking;
            assignments[s.lab] = s.assigned['1'];
            rankings[s.lab] = s.ranking;
        });
        callback(lackings,assignments,rankings);
    });
}

exports.getRerankData = function(roundNum,semester,callback){
    // Used for reranking
    var data = {
        semester: semester
    };
    LabSetting.find(data).exec(function(err,labSettings){
        var reranksNeeded = {},
            limit = {},
            assignments = {},
            rankings = {},
            rerankLabs = [];

        var mode1 = 'Round' + roundNum + 'Rerank',
            mode2 = 'Round' + roundNum + 'Ready';

        labSettings.forEach(function(s){
            reranksNeeded[s.lab] = s.rerankNeeded;
            limit[s.lab] = s.lacking;
            if(roundNum == '1'){
                assignments[s.lab] = s.assigned['1'];
            }else if(roundNum == '2'){
                assignments[s.lab] = s.assigned['1'].concat(s.assigned['2'])
            }
            rankings[s.lab] = s.ranking;


            if(s.currentMode == mode1 || s.currentMode == mode2){
                rerankLabs.push(s.lab);
            }
            // console.log(s.currentMode);
        });
        console.log(rerankLabs);
        callback(reranksNeeded,limit,assignments,rankings,rerankLabs);
    });
}
exports.getColorTable = function(semester,callback){
    var data = {
        semester: semester
    };
    LabSetting.find(data).exec(function(err,labSettings){
        var colorTable = {},
            details = {};
        if(err){
            callback(err,null);
        }else{
            labSettings.forEach(function(labSetting){
                colorTable[labSetting.lab] = labSetting.colorTable.split('');
                details[labSetting.lab] = labSetting.colorTableDetails;
            });
            callback(null,colorTable,details);
        }
    });
};

exports.saveAssignment = function(semester,roundNum,assignment,lacking,ranking,nextMode,callback){
    var limit = 0,
        counter = 0;

    for(var lab in assignment){ limit += 1; }

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };

    for(var lab in assignment){
        var query = {
                semester: semester,
                lab: lab
            };
        var key = 'assigned.' + roundNum,
            updateData = {};

        updateData[key] = assignment[lab];
        updateData.currentMode = nextMode;
        if(lacking !== null){
            updateData.lacking = lacking[lab];   
        }
        if(roundNum == '1'){
            updateData.rankCount = ranking[lab].length;
        }
        LabSetting.update(query,{'$set': updateData},sharedCallback);

    }
};

exports.tempSaveAssignment = function(semester,roundNum,assignment,rerank,lacking,ranking,nextMode,callback){
    var limit = 0,
        counter = 0;

    for(var lab in assignment){ limit += 1; }

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };

    for(var lab in assignment){
        var query = {
                semester: semester,
                lab: lab
            };
        var key = 'assigned.' + roundNum,
            setData = {},
            addToSetData = {};

        addToSetData[key] = { '$each': assignment[lab] }
        setData.currentMode = nextMode;
        setData.rerankNeeded = rerank[lab];
        if(lacking !== null){
            setData.lacking = lacking[lab];   
        }

        if(roundNum == '1'){
            setData.rankCount = ranking[lab].length;
        }

        LabSetting.update(query,{'$set': setData, '$addToSet': addToSetData},sharedCallback);

    }
};

exports.saveColorTable = function(semester,colorTable,details,callback){
    var limit = 0,
        counter = 0;

    for(var lab in colorTable){ limit += 1; }

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };

    for(var lab in colorTable){
        var query = {
                semester: semester,
                lab: lab
            },
        updateData = {
                colorTable: colorTable[lab].join(''),
                colorTableDetails: details[lab]
            };
        LabSetting.update(query,{'$set': updateData},sharedCallback);
    }
};

exports.getCurrentMode = function(semester,lab,callback){
    var query = {
            semester: semester,
            lab: lab
        };
    LabSetting.findOne(query,function(err,labSetting){
        callback(labSetting.currentMode);
    });
};

exports.getCurrentModeAndRerank = function(semester,lab,callback){
    var query = {
            semester: semester,
            lab: lab
        };
    LabSetting.findOne(query,function(err,labSetting){
        callback(labSetting.currentMode,labSetting.rerankNeeded);
    });
};


exports.getCurrentModes = function(semester,callback){
    var query = {
        semester: semester
    };

    LabSetting.find(query).sort({'lab':1}).exec(function(err,labSettings){
        var currentMode = {};
        labSettings.forEach(function(labSetting){
            currentMode[labSetting.lab] = labSetting.currentMode; 
        });
        callback(currentMode);
    });
};

exports.getAssignments = function(semester,key,callback){
    var query = {
        semester: semester
    };
    LabSetting.find(query).sort({'lab':1}).exec(function(err,labSettings){
        var assignments = {};
        labSettings.forEach(function(labSetting){
            assignments[labSetting.lab] = labSetting.assigned[key]; 
        });
        callback(assignments);
    });
};

exports.getAllAssignmentsAndExtra = function(semester,callback){
    var query = {
        semester: semester
    };
    LabSetting.find(query).sort({'lab':1}).exec(function(err,labSettings){
        var assignments = {},
            extras = {};
        labSettings.forEach(function(labSetting){
            assignments[labSetting.lab] = labSetting.assigned['1'].concat(labSetting.assigned['2']); 
            extras[labSetting.lab] = labSetting.extra;
        });
        callback(assignments,extras);
         
    });
};

exports.getExtra = function(semester,lab,callback){
    var query = {
        semester: semester,
        lab: lab
    };
    LabSetting.findOne(query,function(err,labSetting){
        callback(labSetting.extra)
    });
};

exports.getResults = function(semester,callback){
    var query = {
        semester: semester
    };
    LabSetting.find(query).sort({'lab':1}).exec(function(err,labSettings){
        var assignments = {};
        labSettings.forEach(function(labSetting){
            var a1 = labSetting.assigned['1'] || [],
                a2 = labSetting.assigned['2'] || [],
                a3 = labSetting.assigned['3'] || [];
            assignments[labSetting.lab] = {
                '1' : a1,
                '2' : a2,
                '3': a3
            };
        });
        callback(assignments);
         
    });
};


exports.getLabResults = function(semester,lab,callback){
    var query = {
        semester: semester,
        lab: lab
    };
    LabSetting.findOne(query,function(err,labSetting){
        if(labSetting){
            var assigned = labSetting.assigned || {};
            var a1 = assigned['1'] || [],
                a2 = assigned['2'] || [],
                a3 = assigned['3'] || [];
            var assignment = {
                '1' : a1,
                '2' : a2,
                '3': a3
            };
            var totalSlots = (labSetting.required || 0) + (labSetting.additional || 0);
            callback(assignment,totalSlots);
        }else{
            callback({},0);
        }
         
    });
};


exports.getRerankLabs = function(semester,roundNum,callback){
    var query = {
        semester: semester
    };
    LabSetting.find(query).sort({'lab':1}).exec(function(err,labSettings){
        var rerankLabs = {},
            mode1 = 'Round' + roundNum + 'Rerank',
            mode2 = 'Round' + roundNum + 'Ready';

        labSettings.forEach(function(labSetting){
            var hasCorrectMode = labSetting.currentMode == mode1 || labSetting.currentMode == mode2,
                hasToRerank = labSetting.rerankNeeded > 0;
                
            if(hasCorrectMode && hasToRerank){
                rerankLabs[labSetting.lab] = labSetting.currentMode;
            }
        });
        callback(rerankLabs);
    });
};

exports.resetRound = function(semester,roundNum,callback){
/*
LabSetting.currentMode = 'Round' + roundNum + 'Rank' / Round3Pick
LabSetting.round(roundNum)Details = ''
LabSetting.round(roundNum after)Details = ''
LabSetting.assigned[roundNum] = []
LabSetting.assigned[roundNum after] = []
LabSetting.rerankNeeded = 0
LabSetting.extra = []
*/
    var query = {
        semester: semester
    };
    var updateData = {};

    if(roundNum == '3'){
        updateData.currentMode = 'Round3Pick';
    }else{
        updateData.currentMode = 'Round' + roundNum + 'Rank';
    }
    // updateData['round' + roundNum + 'Details'] = '';
    // if(roundNum == '1'){
    //     updateData['round2Details'] = '';
    //     updateData['round3Details'] = '';
    // }else if(roundNum == '2'){
    //     updateData['round3Details'] = '';
    // }
    updateData['assigned.' + roundNum] = [];
    if(roundNum == '1'){
        updateData['assigned.2'] = [];
        updateData['assigned.3'] = [];
    }else if(roundNum == '2'){
        updateData['assigned.3'] = [];
    }
    updateData.rerankNeeded = 0;
    updateData.extra = [];

    LabSetting.update(query,{ '$set': updateData },{multi:true},callback); 
};

exports.resetRound1 = function(currentSemester,callback){
    var query = {semester: currentSemester},
        updateData = {
            rankCount : 0,
            lacking: 0,
            ranking: []  
        };
    LabSetting.update(query,{ '$set': updateData },{multi:true},callback);   
};

exports.resetRound2 = function(semester,limit,groupCount,callback){
//  LabSetting.lacking = totalSlots - numOfStudents in assigned[1]
//  LabSetting.ranking = oldRanking up to rankCount (erase Round 2 rankings)  
    var counter = 0;


    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };

    var query = { semester: semester };
    LabSetting.find(query).sort({'lab':1}).exec(function(err,labSettings){
        labSettings.forEach(function(labSetting){
            var query = {
                    semester: semester,
                    lab: labSetting.lab
                },
                updateData = {};
            var assigned = labSetting.assigned['1'] || [];
            var lacking = labSetting.required + labSetting.additional;
            assigned.forEach(function(group){
                lacking -= groupCount[group];
            })
            updateData.lacking = lacking;
            updateData.ranking = labSetting.ranking.splice(0,labSetting.rankCount);

            LabSetting.update(query,{'$set':updateData},sharedCallback);

        })
    });
};