var fs = require('fs');
var mongoose = require('mongoose');
var LabSetting = mongoose.model('LabSetting');
/*
var required = {};
fs.readFile('data/labRequired.json',function(err,data){
     required = JSON.parse(data);
});

fs.writeFile('data/labRequired.json',objectToString(required),function(err){
    console.log(err); 
});

*/
var folder = './testModel/data/';
var files = {};
files['acl'] = 'acl.json';
files['csg'] = 'csg.json';
files['cvmig'] = 'cvmig.json';
files['ndsg'] = 'ndsg.json';
files['s3'] = 's3.json';
files['scl'] = 'scl.json';
files['wsg'] = 'wsg.json';
var allLabs = Object.keys(files);

var objectToString = function(obj){
    var string = JSON.stringify(obj);
    string = string.replace(/^\{/g,"{\n\t").replace(/\}$/g,"\n}");
    string = string.replace(/\:\{/g,":{\n\t").replace(/\}\,/g,"\n\t},");
    string = string.replace(/\,/g,",\n\t")

    return string;
};


var labSettingsHandler = function(labs,callback){
    var limit = labs.length;
    var counter = 0;
    var labSettings = [];

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            // console.log(err)
            // console.log(labSettings)
            if(limit == 1){
                if(labSettings.length > 0){
                    callback(err,labSettings[0]);   
                }else{
                    callback(err,null);
                }
            }else{
                callback(err,labSettings);   
            }
        } 
    };
    labs.forEach(function(lab){
        var path = folder + files[lab];
        fs.stat(path,function(err,stat){
            if(err){
                sharedCallback(null);
            }else if(stat){
                fs.readFile(path,function(err,data){
                    var labSetting = JSON.parse(data);
                    labSetting.lab = lab;
                    labSettings.push(labSetting);
                    sharedCallback(null);
                })
            }
        });
    })
};

exports.getLabSettings = function(semester,callback){
    labSettingsHandler(allLabs,callback);
};

exports.getLabSetting = function(semester,lab,callback){
    labSettingsHandler([lab],callback);
};


exports.resetRequired = function(semester,callback){
    var limit = allLabs.length;
    var counter = 0;

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };
    for(var lab in files){
        var path = folder + files[lab];
        fs.unlink(path,sharedCallback);
    }
};

exports.updateRequired = function(data,callback){
    var limit = Object.keys(data.required).length;
    var counter = 0;

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };
    for(var lab in data.required){
        var path = folder + files[lab];
        var obj = {};
        obj.required = data.required[lab];
        obj.ranking = "";
        obj.rankCount = 0;
        obj.extra = "";
        obj.assigned = {'1':"",'2':"",'3':""};
        obj.rerankNeeded = 0;
        obj.currentMode = "Round1Rank";

        fs.writeFile(path,objectToString(obj),sharedCallback);
    }
};



exports.updateAdditional = function(data,callback){
    var path = folder + files[data.lab];
    labSettingsHandler([data.lab],function(err,labSetting){
        labSetting.additional = data.additional;
        fs.writeFile(path,objectToString(labSetting),callback);
    });
};

exports.getTotalSlots = function(semester,callback){
    labSettingsHandler(allLabs,function(err,labSettings){
        var totalSlots = {};
        labSettings.forEach(function(labSetting){
            totalSlots[labSetting.lab] = labSetting.required + labSetting.additional;
        })   
        callback(null,totalSlots);
    });
};

exports.getCurrentMode = function(semester,lab,callback){

    labSettingsHandler([lab],function(err,labSetting){
        callback(labSetting.currentMode);
    })
};

exports.getCurrentModeAndRerank = function(semester,lab,callback){

    labSettingsHandler([lab],function(err,labSetting){
        callback(labSetting.currentMode,labSetting.rerankNeeded);
    })
};


exports.getCurrentModes = function(semester,callback){

    labSettingsHandler(allLabs,function(err,labSettings){
        var currentMode = {};
        labSettings.forEach(function(labSetting){
            currentMode[labSetting.lab] = labSetting.currentMode;
        })   
        callback(currentMode);
    });
};

exports.getExtra = function(semester,lab,callback){
    labSettingsHandler([lab],function(err,labSetting){
        var extra = labSetting.extra.split(' ');
        if(labSetting.extra === ''){
            extra = [];
        }
        callback(extra);
    })
};

exports.addExtra = function(data,callback){
    var path = folder + files[data.lab];
    labSettingsHandler([data.lab],function(err,labSetting){
        labSetting.extra = data.extra.join(' ');
        labSetting.currentMode = data.nextMode;
        fs.writeFile(path,objectToString(labSetting),callback);
    });
};



exports.saveColorTable = function(semester,colorTable,details,callback){
    var limit = Object.keys(colorTable).length,
        counter = 0;

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };
    labSettingsHandler(Object.keys(colorTable),function(err,labSettings){
        labSettings.forEach(function(labSetting){
            var lab = labSetting.lab;
            var path = folder + files[lab];
            labSetting.colorTable = colorTable[lab].join('');
            labSetting.colorTableDetails = details[lab];
            fs.writeFile(path,objectToString(labSetting),sharedCallback);
        })
    });
};

exports.getColorTable = function(semester,callback){
    labSettingsHandler(allLabs,function(err,labSettings){
        var colorTable = {},
            details = {};
        labSettings.forEach(function(labSetting){
            colorTable[labSetting.lab] = labSetting.colorTable.split('');
            details[labSetting.lab] = labSetting.colorTableDetails;
        });
        callback(null,colorTable,details);
    });
};


exports.addRanking = function(data,callback){
    labSettingsHandler([data.lab],function(err,labSetting){
        var path = folder + files[data.lab];
        if(data.currentRound == 'Round1'){
            labSetting.rankCount = labSetting.rankCount + data.ranking.length;
        }

        var oldRanking = labSetting.ranking.split(' ');
        if(labSetting.ranking === ''){
            oldRanking = [];
        }
        data.ranking.forEach(function(group){
            oldRanking.addToSet(group);
        });
        labSetting.ranking = oldRanking.join(' ');
        labSetting.currentMode = data.nextMode;

        fs.writeFile(path,objectToString(labSetting),callback);
    });
};

exports.getRankings = function(semester,callback){
    labSettingsHandler(allLabs,function(err,labSettings){
        var rankings = {};
        labSettings.forEach(function(labSetting){
            rankings[labSetting.lab] = labSetting.ranking.split(' ');
        });
        callback(null,rankings);
    });
};

exports.getRoundRanking = function(semester,lab,round,callback){


    labSettingsHandler([lab],function(err,labSetting){
        var ranking = labSetting.ranking.split(' ');
        if(labSetting.ranking === ''){
            ranking = [];
        }
        var count = ranking.length,
            rankCount = labSetting.rankCount;
        if(round == 1){
            callback(ranking.splice(0,rankCount));
        }else{
            callback(ranking.splice(rankCount,count));
        }
    });
};



exports.saveAssignment = function(semester,roundNum,assignment,lacking,ranking,nextMode,callback){
    var limit = Object.keys(assignment).length,
        counter = 0;

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };
    labSettingsHandler(Object.keys(assignment),function(err,labSettings){
        if(limit == 1){
            labSettings = [labSettings];
        }
        labSettings.forEach(function(labSetting){
            var lab = labSetting.lab;
            var path = folder + files[lab];
            labSetting.assigned[roundNum] = assignment[lab].join(' ');
            labSetting.currentMode = nextMode;
            if(lacking !== null){
                labSetting.lacking = lacking[lab];   
            }
            if(roundNum == '1'){
                labSetting.rankCount = ranking[lab].length;
            }
            fs.writeFile(path,objectToString(labSetting),sharedCallback);
        })
    });

};

exports.tempSaveAssignment = function(semester,roundNum,assignment,rerank,lacking,ranking,nextMode,callback){
    var limit = Object.keys(assignment).length,
        counter = 0;

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };

    labSettingsHandler(Object.keys(assignment),function(err,labSettings){
        if(limit == 1){
            labSettings = [labSettings];
        }
        labSettings.forEach(function(labSetting){
            var lab = labSetting.lab;
            var path = folder + files[lab];
            var assigned = labSetting.assigned[roundNum].split(' ');
            if(labSetting.assigned[roundNum] === ''){
                assigned = [];
            }
            assignment[lab].forEach(function(group){
                assigned.addToSet(group);
            });
            labSetting.assigned[roundNum] = assigned.join(' ');
            labSetting.currentMode = nextMode;
            labSetting.rerankNeeded = rerank[lab];
            if(lacking !== null){
                labSetting.lacking = lacking[lab];   
            }
            if(roundNum == '1'){
                labSetting.rankCount = ranking[lab].length;
            }
            fs.writeFile(path,objectToString(labSetting),sharedCallback);
        })
    });

};


exports.getAssignments = function(semester,key,callback){
    labSettingsHandler(allLabs,function(err,labSettings){
        var assignments = {};
        labSettings.forEach(function(labSetting){
            var assigned = labSetting.assigned[key].split(' ')
            if(labSetting.assigned[key] == ''){
                assigned = []
            }
            assignments[labSetting.lab] = assigned; 
        });
        callback(assignments);
    });
};

exports.getAllAssignmentsAndExtra = function(semester,callback){
    labSettingsHandler(allLabs,function(err,labSettings){
        var assignments = {},
            extras = {};
        labSettings.forEach(function(labSetting){
            var a1 = labSetting.assigned['1'].split(' '),
                a2 = labSetting.assigned['2'].split(' ');
            if(labSetting.assigned['1'] === ''){ a1 = []; }
            if(labSetting.assigned['2'] === ''){ a2 = []; }
            assignments[labSetting.lab] = a1.concat(a2); 
            var extra = labSetting.extra === '' ? [] : labSetting.extra.split(' ')
            extras[labSetting.lab] = extra;
        });
        callback(assignments,extras);
    });
};


exports.getResults = function(semester,callback){
    labSettingsHandler(allLabs,function(err,labSettings){
        var assignments = {};
        labSettings.forEach(function(labSetting){
            var a1 = labSetting.assigned['1'].split(' '),
                a2 = labSetting.assigned['2'].split(' '),
                a3 = labSetting.assigned['3'].split(' ');
            if(labSetting.assigned['1'] === ''){ a1 = []; }
            if(labSetting.assigned['2'] === ''){ a2 = []; }
            if(labSetting.assigned['3'] === ''){ a3 = []; }
            assignments[labSetting.lab] = {
                '1' : a1,
                '2' : a2,
                '3' : a3
            };
        });
        callback(assignments);
    });
};


exports.getLabResults = function(semester,lab,callback){
    labSettingsHandler([lab],function(err,labSetting){
        if(labSetting){
            var assigned = labSetting.assigned || {};
            var s1 = assigned['1'] || '',
                s2 = assigned['2'] || '',
                s3 = assigned['3'] || '';
            var a1 = s1.split(' '),
                a2 = s2.split(' '),
                a3 = s3.split(' ');
            if(s1 === ''){ a1 = []; }
            if(s2 === ''){ a2 = []; }
            if(s3 === ''){ a3 = []; }
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



exports.getLackingData = function(semester,callback){
    // Used for Round 2

    labSettingsHandler(allLabs,function(err,labSettings){
        var lackings = {},
            assignments = {},
            rankings = {};

        labSettings.forEach(function(s){
            lackings[s.lab] = s.lacking;
            assignments[s.lab] = s.assigned['1'] == '' ? [] : s.assigned['1'].split(' ');
            rankings[s.lab] = s.ranking.split(' ');
        });
        callback(lackings,assignments,rankings);
    });
}

exports.getRerankData = function(roundNum,semester,callback){
    // Used for reranking

    labSettingsHandler(allLabs,function(err,labSettings){
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
                assignments[s.lab] = s.assigned['1'] == '' ? [] : s.assigned['1'].split(' ');
            }else if(roundNum == '2'){
                var a1 = s.assigned['1'] == '' ? [] : s.assigned['1'].split(' '),
                    a2 = s.assigned['2'] == '' ? [] : s.assigned['2'].split(' ');
                assignments[s.lab] = a1.concat(a2)
            }
            rankings[s.lab] = s.ranking.split(' ');


            if(s.currentMode == mode1 || s.currentMode == mode2){
                rerankLabs.push(s.lab);
            }
            // console.log(s.currentMode);
        });
        console.log(rerankLabs);
        callback(reranksNeeded,limit,assignments,rankings,rerankLabs);
    });
}



exports.getRerankLabs = function(semester,roundNum,callback){
    labSettingsHandler(allLabs,function(err,labSettings){
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

    var limit = allLabs.length,
        counter = 0;

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };
    labSettingsHandler(allLabs,function(err,labSettings){
        labSettings.forEach(function(labSetting){
            var lab = labSetting.lab;
            var path = folder + files[lab];

            if(roundNum == '3'){
                labSetting.currentMode = 'Round3Pick';
            }else{
                labSetting.currentMode = 'Round' + roundNum + 'Rank';
            }
            // labSetting['round' + roundNum + 'Details'] = '';
            // if(roundNum == '1'){
            //     labSetting.round2Details = '';
            //     labSetting.round3Details = '';
            // }else if(roundNum == '2'){
            //     labSetting.round3Details = '';
            // }
            labSetting.assigned[roundNum] = '';
            if(roundNum == '1'){
                labSetting.assigned['2'] = '';
                labSetting.assigned['3'] = '';
            }else if(roundNum == '2'){
                labSetting.assigned['3'] = '';
            }
            labSetting.rerankNeeded = 0;
            labSetting.extra = "";

            fs.writeFile(path,objectToString(labSetting),sharedCallback);
        })
    });


};

exports.resetRound1 = function(currentSemester,callback){
    var limit = allLabs.length,
        counter = 0;

    var sharedCallback = function(err){
        counter += 1;
        if(counter == limit || err) {
            callback(err);
        } 
    };

    labSettingsHandler(allLabs,function(err,labSettings){
        labSettings.forEach(function(labSetting){
            var lab = labSetting.lab;
            var path = folder + files[lab];

            labSetting.rankCount = 0;
            labSetting.lacking = 0;
            labSetting.ranking = '';

            fs.writeFile(path,objectToString(labSetting),sharedCallback);
        })
    });
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

    labSettingsHandler(allLabs,function(err,labSettings){
        labSettings.forEach(function(labSetting){
            var path = folder + files[labSetting.lab];

            var assigned = labSetting.assigned['1'] == '' ? [] : labSetting.assigned['1'].split(' ');
            var lacking = labSetting.required + labSetting.additional;
            assigned.forEach(function(group){
                lacking -= groupCount[group];
            })
            labSetting.lacking = lacking;
            var ranking = labSetting.ranking.split(' ');
            if(labSetting.ranking === ''){
                ranking = [];
            }
            labSetting.ranking = ranking.splice(0,labSetting.rankCount).join(' ');
            
            fs.writeFile(path,objectToString(labSetting),sharedCallback);

        })
    });
};