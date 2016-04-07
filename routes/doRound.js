var studentGroupModel = require('../model/studentGroup'),
    adminModel = require('../model/admin'),
    labSettingModel = require('../model/labSetting');


if(!studentGroupModel.USE_DB){
    var labSettingModel = require('../testModel/labSetting');
}

var NAME_SEPARATOR = '<br/>';

var selectGroups = function(choices,limit,unassigned){
    var selection = [],
        totalSelected = 0;
    for(var i = 0; i < choices.length; i++){
        var tuple = choices[i],
            groupNumber = tuple[0],
            groupMembers = tuple[1];
        if(totalSelected == limit || totalSelected == limit + 1){
            break;
        }   
        if(unassigned.indexOf(groupNumber) === -1){
            // console.log('Skipping ' + groupNumber);
            continue; // Skip if not in unassigned
        }
        selection.push(groupNumber);
        totalSelected += groupMembers.length;
    }

    return [selection,totalSelected]; 
};

var countLacking = function(assignment,limit,groupCount){
    var totalAssigned = 0;
    assignment.forEach(function(group){
        totalAssigned += groupCount[group];
    });
    return limit - totalAssigned;
};
var performRound = function(roundNum,roundLimit,labRanking,studentRanking,groupCount,unassigned,labs,log){
    var selections = {},
        rerank = {},
        assignment = {};

    // console.log(labRanking);
    // console.log(roundLimit);
    // console.log(unassigned);
    log.push('<tr class="separator"><th colspan="3">Select Groups</th></tr>')
    labs.forEach(function(lab){
        assignment[lab] = [];
        // console.log(lab + ' , ' + roundLimit[lab]);
        // console.log(unassigned.length);
        var response = selectGroups(labRanking[lab],roundLimit[lab],unassigned);
        selections[lab] = response[0]; 
        labRanking[lab] = labRanking[lab].filter(function(tuple){
            // Keep only those groups not selected
            return selections[lab].indexOf(tuple[0]) === -1;
        });
        var selectString = [];
        selections[lab].forEach(function(group){
            selectString.push(group + '<sub>' + groupCount[group] + '</sub>') 
        });
        log.push('<tr><td rowspan="2">' + lab.toUpperCase() + '</td><td rowspan="2">select</td>')
        if(selectString.length == 0){
            log.push('<td>None</td></tr>')
        }else{
            log.push('<td>' + selectString.join(' , ') + '</td></tr>')
        }
        log.push('<tr><td>Selected: ' + response[1] + ', Required: ' + roundLimit[lab] + '</td></tr>')
    });
    // console.log(selections);
    // console.log(labRanking);
    // return selections;
    var status;
    while(true){
        var claims = {};
        for(var lab in selections){
            selections[lab].forEach(function(group){
                claims[group] = claims[group] || [];
                claims[group].push(lab);
            });
        }
        log.push('<tr class="separator"><th colspan="3">Group Claims</th></tr>')
        log.push('<tr><th>Group</th><th colspan="2">Labs Claiming</th></tr>')
        var groups = Object.keys(claims);
        groups.sort().forEach(function(group){
            log.push('<tr><td>' + group + '</td>')
            log.push('<td colspan="2">' + claims[group].join(' , ').toUpperCase() + '</td></tr>')
        })

        log.push('<tr class="separator"><th colspan="3">Selection Results</th></tr>')
        log.push('<tr><th>Lab</th><th>Action</th><th>Details</th></tr>')
        for(var lab in selections){
            log.push('<tr>')
            log.push('<td rowspan="' + (selections[lab].length + 1) + '">' + lab.toUpperCase() + '</td>')
            // var i = 0;
            var totalSelected = 0;
            selections[lab].forEach(function(group){
                log.push('<td>' + group + '<sub>' + groupCount[group] + '</sub> : ');
                if(claims[group].length == 1){
                    log.push('YES</td>')
                    log.push('<td>Solo Claim</td>')
                    assignment[lab].push(group);
                    unassigned.remove(group);
                    totalSelected += groupCount[group];
                }else{
                    var labIndex = claims[group].indexOf(lab);
                    var indices = claims[group].map(function(lab){
                         return studentRanking[group].indexOf(lab);
                    });
                    var minLab = Math.min.apply(this,indices);
                    var minIndex = indices.indexOf(minLab);
                    if(labIndex == minIndex){
                        log.push('YES</td>')
                        assignment[lab].push(group);
                        unassigned.remove(group);
                        totalSelected += groupCount[group];
                    }else{
                        log.push('NO</td>')
                    }
                    var claimingLabs = [];
                    studentRanking[group].forEach(function(laboratory){
                        if(claims[group].indexOf(laboratory) !== -1){
                            if(laboratory == lab){
                                claimingLabs.push('<strong>' + laboratory + '</strong>')
                            }else{
                                claimingLabs.push(laboratory)
                            }
                        } 
                    });
                    log.push('<td>Student Preference: ' + claimingLabs.join(' &gt; ') + '</td>')
                }
                log.push('</tr><tr>')  
                // i++;
            });
            log.push('<th>Total</th><th>' + totalSelected + '</th></tr>')
        };
        console.log('..Selection..')
        console.log(selections);
        console.log('..Assignment..')
        console.log(assignment);
        console.log('**************');

        if(unassigned.length == 0){
            console.log('Distributed all students..DONE!');
            log.push('<tr class="separator"><th colspan="3">No unassigned students left</th></tr>')
            log.push('<tr class="separator"><th colspan="3">All students assigned = DONE!</th></tr>')
            status = 'Done';
            break; 
        }


        selections = {};
        rerank = {};
        // var countSelected = 0;
        var labWithInsufficientRankings = [];
        log.push('<tr class="separator"><th colspan="3">Count Lacking and Re-select</th></tr>')

        labs.forEach(function(lab){
            log.push('<tr>')
            var lacking = countLacking(assignment[lab],roundLimit[lab],groupCount);
            console.log(lab + ' , Lacking: ' + lacking);
            if(lacking != 0 && lacking != -1){
                var response = selectGroups(labRanking[lab],lacking,unassigned);
                selections[lab] =  response[0];
                labRanking[lab] = labRanking[lab].filter(function(tuple){
                    // Keep only those groups not selected
                    return selections[lab].indexOf(tuple[0]) === -1;
                });
                // countSelected += selections[lab].length;
                // if(selections[lab].length == 0){
                var color = 'y';
                if(response[1] < lacking){ //totalSelected < lacking
                    labWithInsufficientRankings.push(lab);
                    color = 'r';
                }
                rerank[lab] = lacking - response[1];   
                log.push('<td class="' + color + '" rowspan="3">' + lab.toUpperCase() + ' </td>')
                log.push('<td class="' + color + '">lacking</td>')
                log.push('<td class="' + color + '">' + lacking + '</td>')
                log.push('</tr><tr>')
                log.push('<td class="' + color + '" rowspan="2">select</td>')


                var selectString = [];
                selections[lab].forEach(function(group){
                    selectString.push(group + '<sub>' + groupCount[group] + '</sub>') 
                });
                if(selectString.length == 0){
                    log.push('<td class="' + color + '">None</td></tr>')
                }else{
                    log.push('<td class="' + color + '">' + selectString.join(' , ') + '</td></tr>')
                }
                log.push('<tr><td class="' + color + '">Selected: ' + response[1] + ', Required: ' + lacking + '</td>')

            }else{
                log.push('<td>' + lab.toUpperCase() + ' </td>')
                log.push('<td>lacking</td>')
                log.push('<td>' + lacking + ' </td>')
            }
            log.push('</tr>')
        });
        if(Object.keys(selections).length == 0){ 
            log.push('<tr class="separator"><th colspan="3">Round ' + roundNum + ' Finished</th></tr>')
            console.log('Finished up Round ' + roundNum);
            status = 'Rank' + (roundNum + 1);
            break; 
        // }else if(countSelected == 0){
        }else if(labWithInsufficientRankings.length > 0){
            log.push('<tr class="separator"><th colspan="3">Some labs have insufficient rankings</th></tr>')
            log.push('<tr><th>LABS</th><th colspan="2">' + labWithInsufficientRankings.join(' , ').toUpperCase() + '</th></tr>')
            console.log('No more rankings..');
            console.log(labWithInsufficientRankings);
            status = 'Rerank' + roundNum;
            break;
        }
    }
    return [assignment,rerank,status];
};



exports.round1 = function(req,res){
    var labs = studentGroupModel.labs,
        roundLimit = {},
        log = [];

    log.push('<tr class="separator"><th colspan="3">Round 1 Details</th></tr>')
    log.push('<tr><th>Lab</th><th>Action</th><th>Details</th></tr>')
    adminModel.getCurrentSemester(function(semester){
        labSettingModel.getTotalSlots(semester,function(err,totalSlots){
            labs.forEach(function(lab){
                roundLimit[lab] = Math.floor(0.6 * totalSlots[lab]);
            });
            studentGroupModel.getStudentGroups(semester,function(err,studentGroups){
                var unassigned = [],
                    studentRanking = {},
                    names = {},
                    groupCount = {};
                studentGroups.forEach(function(group){
                    unassigned.push(group.number);
                    studentRanking[group.number] = group.ranking;
                    names[group.number] = group.names;
                    groupCount[group.number] = group.names.length;
                });
                labSettingModel.getRankings(semester,function(err,rankings){
                    var labRanking = {};
                    for(var lab in rankings){
                        labRanking[lab] = rankings[lab].filter(function(groupNumber){
                            // Only unassigned groups
                            return unassigned.indexOf(groupNumber) !== -1;
                        }).map(function(groupNumber){
                            return [groupNumber,names[groupNumber]];
                        });
                        log.push('<tr><td rowspan="2">' + lab.toUpperCase() + '</td><td>limit</td>')
                        log.push('<td>60% of ' + totalSlots[lab] + ' = ' + roundLimit[lab] +  '</td></tr>')
                        var rankString = [];
                        labRanking[lab].forEach(function(pair){
                            rankString.push(pair[0] + '<sub>' + pair[1].length + '</sub>')
                        });
                        if(rankString.length == 0){
                            log.push('<tr><td>ranking</td><td>None</td></tr>')
                        }else{
                            log.push('<tr><td>ranking</td><td>' + rankString.join(' , ') + '</td></tr>')
                        }
                    }
                    adminModel.updateCurrentMode('Round1',function(err){
                        if(err){
                            console.log(err);
                            return res.send("ERROR");
                        }
                        var response = performRound(1,roundLimit,labRanking,studentRanking,groupCount,unassigned,labs,log),
                        assignment = response[0],
                        rerank = response[1],
                        status = response[2];

                        var details = log.join('\n');
                        if(status == 'Rank2' || status == 'Done'){
                            var lacking = {};
                            labs.forEach(function(lab){
                                lacking[lab] = countLacking(assignment[lab],totalSlots[lab],groupCount);
                            });
                            var labStatus = 'Round2Rank';
                            if(status == 'Done'){
                                labStatus = 'Done';
                            }
                            labSettingModel.saveAssignment(semester,'1',assignment,lacking,rankings,labStatus,function(err){
                                if(err){
                                    console.log(err);
                                    return res.send("ERROR");
                                }
                                adminModel.updateCurrentModeAndDetails(status,'1',details,function(err){
                                    if(err){
                                        console.log(err);
                                        return res.send("ERROR");
                                    }else{
                                        console.log("Successfully completed Round 1.");
                                        return res.send("OK");
                                    }
                                })
                            })
                        }else if(status == 'Rerank1'){
                            var assignmentDone = {},
                                assignmentRerank = {},
                                lackingDone = {},
                                lackingRerank = {},
                                rankingsDone = {},
                                rankingsRerank = {};

                            var rerankLabs = Object.keys(rerank);

                            for(var lab in assignment){
                                if(rerankLabs.indexOf(lab) === -1){
                                    assignmentDone[lab] = assignment[lab];
                                    lackingDone[lab] = countLacking(assignment[lab],totalSlots[lab],groupCount);
                                    rankingsDone[lab] = rankings[lab];
                                }else{
                                    assignmentRerank[lab] = assignment[lab];
                                    lackingRerank[lab] = countLacking(assignment[lab],roundLimit[lab],groupCount);
                                    rankingsRerank[lab] = rankings[lab];
                                }
                            }
                            labSettingModel.saveAssignment(semester,'1',assignmentDone,lackingDone,rankingsDone,'Round2Rank',function(err){
                                labSettingModel.tempSaveAssignment(semester,'1',assignmentRerank,rerank,lackingRerank,rankingsRerank,'Round1Rerank',function(err){
                                    adminModel.updateCurrentModeAndDetails(status,'1',details,function(err){
                                        if(err){
                                            console.log(err);
                                            return res.send("ERROR");
                                        }else{
                                            console.log("Rerank needed for Round 1.");
                                            return res.send("RERANK");
                                        }
                                    })
                                })
                            });
                        }
                    });
                    
                });
            });
        });
    });
};


exports.resumeRound1 = function(req,res){
    adminModel.getCurrentSemester(function(currentSemester){
    labSettingModel.getTotalSlots(currentSemester,function(err,totalSlots){
    studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
    adminModel.updateCurrentMode('Round1',function(err){
    labSettingModel.getRerankData('1',currentSemester,function(reranksNeeded,limit,assignments,rankings,rerankLabs){

        var log = [];

        log.push('<tr class="separator"><th colspan="3">Resume Round 1</th></tr>')
        log.push('<tr><th>Lab</th><th>Action</th><th>Details</th></tr>')
        var roundLimit = {};
        rerankLabs.forEach(function(lab){
            roundLimit[lab] = limit[lab];
        })
        console.log('roundLimit');
        console.log(roundLimit);

        var alreadyAssigned = [];
        for(var lab in assignments){
            assignments[lab].forEach(function(group){
                alreadyAssigned.push(group);
            })
        }
        console.log('alreadyAssigned');
        console.log(alreadyAssigned.sort().join(' '));

        var unassigned = [],
            studentRanking = {},
            names = {},
            groupCount = {};
        studentGroups.forEach(function(group){
            if(alreadyAssigned.indexOf(group.number) === -1){
                unassigned.push(group.number);
            }
            names[group.number] = group.names;
            studentRanking[group.number] = group.ranking;
            groupCount[group.number] = group.names.length;
        });
        console.log('unassigned')
        console.log(unassigned.sort().join(' '))
        var labRanking = {};
        rerankLabs.forEach(function(lab){
            labRanking[lab] = rankings[lab].filter(function(groupNumber){
                return unassigned.indexOf(groupNumber) !== -1;
            }).map(function(groupNumber){
                return [groupNumber,names[groupNumber]];
            });
            log.push('<tr><td rowspan="2">' + lab.toUpperCase() + '</td><td>limit</td>')
            log.push('<td>' + roundLimit[lab] +  '</td></tr>')
            var rankString = [];
            labRanking[lab].forEach(function(pair){
                rankString.push(pair[0] + '<sub>' + pair[1].length + '</sub>')
            });
            if(rankString.length == 0){
                log.push('<tr><td>ranking</td><td>None</td></tr>')
            }else{
                log.push('<tr><td>ranking</td><td>' + rankString.join(' , ') + '</td></tr>')
            }
        })
        console.log(labRanking)
        console.log('labRanking')

        var response = performRound(1,roundLimit,labRanking,studentRanking,groupCount,unassigned,rerankLabs,log),
            assignment = response[0],
            rerank = response[1],
            status = response[2];
        console.log('----\nRESULTS');
        console.log(assignment);
        console.log(rerank);
        console.log(status);
        // return res.send("ERROR");
        var details = log.join('\n')
        if(status == 'Rank2' || status == 'Done'){
            var lacking = {};
            var wholeAssignment = {};
            rerankLabs.forEach(function(lab){
                var labAssignment = assignments[lab].concat(assignment[lab])
                wholeAssignment[lab] = labAssignment;
                lacking[lab] = countLacking(labAssignment,totalSlots[lab],groupCount);
            });
            var labStatus = 'Round2Rank';
            if(status == 'Done'){
                labStatus = 'Done';
            }
            labSettingModel.saveAssignment(currentSemester,'1',wholeAssignment,lacking,rankings,labStatus,function(err){
                if(err){
                    console.log(err);
                    return res.send("ERROR");
                }
                adminModel.updateCurrentModeAppendDetails(status,'1',details,function(err){
                    if(err){
                        console.log(err);
                        return res.send("ERROR");
                    }else{
                        console.log("Successfully completed Round 1.");
                        return res.send("OK");
                    }
                })
            })
        }else if(status == 'Rerank1'){
            var assignmentDone = {},
                assignmentRerank = {},
                lackingDone = {},
                lackingRerank = {},
                rankingsDone = {},
                rankingsRerank = {};

            var rerankLabs = Object.keys(rerank);
            console.log(assignment)
            console.log(rerankLabs)
            
            var wholeAssignment = {};
            for(var lab in assignment){
                var labAssignment = assignments[lab].concat(assignment[lab])
                if(rerankLabs.indexOf(lab) === -1){
                    assignmentDone[lab] = labAssignment;
                    lackingDone[lab] = countLacking(labAssignment,totalSlots[lab],groupCount);
                    rankingsDone[lab] = rankings[lab];
                }else{
                    assignmentRerank[lab] = labAssignment;

                    lackingRerank[lab] = countLacking(assignment[lab],roundLimit[lab],groupCount);
                    rankingsRerank[lab] = rankings[lab];
                }
            }
            labSettingModel.saveAssignment(currentSemester,'1',assignmentDone,lackingDone,rankingsDone,'Round2Rank',function(err){
                labSettingModel.tempSaveAssignment(currentSemester,'1',assignmentRerank,rerank,lackingRerank,rankingsRerank,'Round1Rerank',function(err){
                    adminModel.updateCurrentModeAppendDetails(status,'1',details,function(err){
                        if(err){
                            console.log(err);
                            return res.send("ERROR");
                        }else{
                            console.log("Rerank needed for Round 1.");
                            return res.send("RERANK");
                        }
                    })
                })
            });
        }
    });
    });
    });
    });
    });
};




exports.round2 = function(req,res){
    var labs = studentGroupModel.labs,
        roundLimit = {},
        log = []


    log.push('<tr class="separator"><th colspan="3">Round 2 Details</th></tr>')
    log.push('<tr><th>Lab</th><th>Action</th><th>Details</th></tr>')
    adminModel.getCurrentSemester(function(semester){
        labSettingModel.getLackingData(semester,function(lackings,assignments,rankings){
            roundLimit = lackings;
            var alreadyAssigned = [];
            for(var k in assignments){
                assignments[k].forEach(function(group){
                    alreadyAssigned.push(group);
                })
            }
            studentGroupModel.getStudentGroups(semester,function(err,studentGroups){
                var unassigned = [],
                    studentRanking = {},
                    names = {},
                    groupCount = {};
                studentGroups.forEach(function(group){
                    if(alreadyAssigned.indexOf(group.number) === -1){
                        unassigned.push(group.number);
                    }
                    studentRanking[group.number] = group.ranking;
                    names[group.number] = group.names;
                    groupCount[group.number] = group.names.length;
                });
                var round1Assigned = {};
                for(var k in assignments){
                    round1Assigned[k] = 0;
                    assignments[k].forEach(function(group){
                        round1Assigned[k] += groupCount[group];
                    })
                }   
                labSettingModel.getRankings(semester,function(err,rankings){
                    var labRanking = {};
                    // console.log(rankings);
                    for(var lab in rankings){
                        labRanking[lab] = rankings[lab].filter(function(groupNumber){
                            // Only unassigned groups
                            return unassigned.indexOf(groupNumber) !== -1;
                        }).map(function(groupNumber){
                            return [groupNumber,names[groupNumber]];
                        });
                        var totalSlots = roundLimit[lab] + round1Assigned[lab];
                        log.push('<tr><td rowspan="2">' + lab.toUpperCase() + '</td><td>limit</td>')
                        log.push('<td>'+ totalSlots  + ' slots - ' + round1Assigned[lab] +  ' in Rnd1 = ' + roundLimit[lab] +'</td></tr>')
                        var rankString = [];
                        labRanking[lab].forEach(function(pair){
                            rankString.push(pair[0] + '<sub>' + pair[1].length + '</sub>')
                        });
                        if(rankString.length == 0){
                            log.push('<tr><td>ranking</td><td>None</td></tr>')
                        }else{
                            log.push('<tr><td>ranking</td><td>' + rankString.join(' , ') + '</td></tr>')    
                        }
                        
                    }
                    adminModel.updateCurrentMode('Round2',function(err){
                        if(err){
                            console.log(err);
                            return res.send("ERROR");
                        }
                        var response = performRound(2,roundLimit,labRanking,studentRanking,groupCount,unassigned,labs,log),
                            assignment = response[0],
                            rerank = response[1],
                            status = response[2];
                        var details = log.join('\n');
                        if(status == 'Rank3' || status == 'Done'){
                            var labStatus = 'Round3Pick';
                            var lacking = {};
                            labs.forEach(function(lab){
                                lacking[lab] = countLacking(assignment[lab],roundLimit[lab],groupCount);
                            });
                            console.log(lacking);
                            console.log(unassigned.length);
                            if(unassigned.length == 0){
                                status = 'Done';
                                labStatus = 'Done';
                            }
                            adminModel.updateCurrentModeAndDetails(status,'2',details,function(err){
                                if(err){
                                    console.log(err);
                                    return res.send("ERROR");
                                }
                                labSettingModel.saveAssignment(semester,'2',assignment,lacking,null,labStatus,function(err){
                                    if(err){
                                        console.log(err);
                                        return res.send("ERROR");
                                    }else{
                                        console.log("Successfully completed Round 2.");
                                        return res.send("OK");
                                    }
                                })
                            })
                        }else if(status == 'Rerank2'){
                            var assignmentDone = {},
                                assignmentRerank = {},
                                lackingDone = {},
                                lackingRerank = {};

                            var rerankLabs = Object.keys(rerank);
                            for(var lab in assignment){
                                if(rerankLabs.indexOf(lab) === -1){
                                    assignmentDone[lab] = assignment[lab];
                                    lackingDone[lab] = countLacking(assignment[lab],roundLimit[lab],groupCount);
                                }else{
                                    assignmentRerank[lab] = assignment[lab];
                                    lackingRerank[lab] = countLacking(assignment[lab],roundLimit[lab],groupCount);
                                }
                            }
                            labSettingModel.saveAssignment(semester,'2',assignmentDone,lackingDone,null,'Round3Pick',function(err){
                                labSettingModel.tempSaveAssignment(semester,'2',assignmentRerank,rerank,lackingRerank,null,'Round2Rerank',function(err){
                    
                                    adminModel.updateCurrentModeAndDetails(status,'2',details,function(err){
                                        if(err){
                                            console.log(err);
                                            return res.send("ERROR");
                                        }else{
                                            console.log("Rerank needed for Round 2.");
                                            return res.send("RERANK");
                                        }
                                    })
                                })
                            });
                        }
                    });
                    
                });
            });
        });
    });
};



exports.resumeRound2 = function(req,res){

    adminModel.getCurrentSemester(function(currentSemester){
    labSettingModel.getAssignments(currentSemester,'2',function(round2Assignments){
    labSettingModel.getTotalSlots(currentSemester,function(err,totalSlots){
    studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
    adminModel.updateCurrentMode('Round2',function(err){
    labSettingModel.getRerankData('2',currentSemester,function(reranksNeeded,limit,assignments,rankings,rerankLabs){
        var roundLimit = {};
        rerankLabs.forEach(function(lab){
            roundLimit[lab] = limit[lab];
        })
        var log = [];

        log.push('<tr class="separator"><th colspan="3">Resume Round 2</th></tr>')
        log.push('<tr><th>Lab</th><th>Action</th><th>Details</th></tr>')

        console.log('roundLimit');
        console.log(roundLimit);

        var alreadyAssigned = [];
        for(var lab in assignments){
            assignments[lab].forEach(function(group){
                alreadyAssigned.push(group);
            })
        }
        console.log('alreadyAssigned');
        console.log(alreadyAssigned.sort().join(' '));

        var unassigned = [],
            studentRanking = {},
            names = {},
            groupCount = {};
        studentGroups.forEach(function(group){
            if(alreadyAssigned.indexOf(group.number) === -1){
                unassigned.push(group.number);
            }
            names[group.number] = group.names;
            studentRanking[group.number] = group.ranking;
            groupCount[group.number] = group.names.length;
        });
        console.log('unassigned')
        console.log(unassigned.sort().join(' '))
        var labRanking = {};
        rerankLabs.forEach(function(lab){
            labRanking[lab] = rankings[lab].filter(function(groupNumber){
                return unassigned.indexOf(groupNumber) !== -1;
            }).map(function(groupNumber){
                return [groupNumber,names[groupNumber]];
            });
            log.push('<tr><td rowspan="2">' + lab.toUpperCase() + '</td><td>limit</td>')
            log.push('<td>' + roundLimit[lab] +  '</td></tr>')
            var rankString = [];
            labRanking[lab].forEach(function(pair){
                rankString.push(pair[0] + '<sub>' + pair[1].length + '</sub>')
            });
            if(rankString.length == 0){
                log.push('<tr><td>ranking</td><td>None</td></tr>')
            }else{
                log.push('<tr><td>ranking</td><td>' + rankString.join(' , ') + '</td></tr>')    
            }
            
        })
        console.log(labRanking)
        console.log('labRanking')

        var response = performRound(2,roundLimit,labRanking,studentRanking,groupCount,unassigned,rerankLabs,log),
            assignment = response[0],
            rerank = response[1],
            status = response[2];
        console.log('----\nRESULTS');
        console.log(assignment);
        console.log(rerank);
        console.log(status);

        var details = log.join('\n')
        // return res.send("ERROR");
        if(status == 'Rank3' || status == 'Done'){
            var lacking = {};
            var wholeAssignment = {};
            rerankLabs.forEach(function(lab){
                var labAssignment = assignments[lab].concat(assignment[lab]);
                    // wholeAssignment[lab] = assignment[lab];
                    wholeAssignment[lab] = round2Assignments[lab].concat(assignment[lab]);
                    lacking[lab] = countLacking(labAssignment,totalSlots[lab],groupCount);
            });
            var labStatus = 'Round3Pick';
            if(status == 'Done'){
                labStatus = 'Done';
            }
            labSettingModel.saveAssignment(currentSemester,'2',wholeAssignment,lacking,rankings,labStatus,function(err){
                adminModel.updateCurrentModeAppendDetails(status,'2',details,function(err){
                    if(err){
                        console.log(err);
                        return res.send("ERROR");
                    }else{
                        console.log("Successfully completed Round 2.");
                        return res.send("OK");
                    }
                })
            })
        }else if(status == 'Rerank2'){
            var assignmentDone = {},
                assignmentRerank = {},
                lackingDone = {},
                lackingRerank = {},
                rankingsDone = {},
                rankingsRerank = {};

            var rerankLabs = Object.keys(rerank);

            var wholeAssignment = {};
            for(var lab in assignment){
                var labAssignment = assignments[lab].concat(assignment[lab])
                if(rerankLabs.indexOf(lab) === -1){
                    // assignmentDone[lab] = assignment[lab];
                    assignmentDone[lab] = round2Assignments[lab].concat(assignment[lab])
                    lackingDone[lab] = countLacking(labAssignment,totalSlots[lab],groupCount);
                    rankingsDone[lab] = rankings[lab];
                }else{
                    // assignmentRerank[lab] = assignment[lab];
                    assignmentRerank[lab] = round2Assignments[lab].concat(assignment[lab])
                    lackingRerank[lab] = countLacking(labAssignment,totalSlots[lab],groupCount);
                    rankingsRerank[lab] = rankings[lab];
                }
            }
            labSettingModel.saveAssignment(currentSemester,'2',assignmentDone,lackingDone,rankingsDone,'Round3Pick',function(err){
                labSettingModel.tempSaveAssignment(currentSemester,'2',assignmentRerank,rerank,lackingRerank,rankingsRerank,'Round2Rerank',function(err){
                    adminModel.updateCurrentModeAppendDetails(status,'2',details,function(err){
                        if(err){
                            console.log(err);
                            return res.send("ERROR");
                        }else{
                            console.log("Rerank needed for Round 2.");
                            return res.send("RERANK");
                        }
                    })
                })
            });
        }
    });
    });
    });
    });
    });
    });
};



var distribute = function(unassigned,extras,studentRanking,labs,log){
    var assignment = {};

    // Even if some groups are manually picked, number of rounds still depend on original number of unassigned
    var numRounds = Math.ceil(unassigned.length / labs.length),
        roundRandomize = {};


    // PERFORM ASSIGNMENT OF PICKED STUDENTS BASED ON RANKING
    log.push('<tr class="separator"><th colspan="3">Picked Groups</th></tr>')
    var claims = {};
    for(var lab in extras){
        assignment[lab] = [];
        var pickString = [];
        extras[lab].forEach(function(group){
            claims[group] = claims[group] || [];
            claims[group].push(lab);
            pickString.push(group)
        });
        log.push('<tr><td>' + lab.toUpperCase() + '</td><td>pick</td>')
        log.push('<td>' + pickString.join(' , ') + '</td></tr>')
    }

    log.push('<tr class="separator"><th colspan="3">Group Claims</th></tr>')
    log.push('<tr><th>Group</th><th colspan="2">Labs Claiming</th></tr>')
    var groups = Object.keys(claims);
    var claimCount = 0;
    groups.sort().forEach(function(group){
        log.push('<tr><td>' + group + '</td>')
        log.push('<td colspan="2">' + claims[group].join(' , ').toUpperCase() + '</td></tr>')
        claimCount += 1;
    })
    if(claimCount == 0){
        log.push('<tr><td colspan="3">None</td></tr>')        
    }else{
        log.push('<tr class="separator"><th colspan="3">Pick Results</th></tr>')
        log.push('<tr><th>Lab</th><th>Action</th><th>Details</th></tr>')
        for(var lab in extras){
            log.push('<tr>')
            log.push('<td rowspan="' + (extras[lab].length + 1) + '">' + lab.toUpperCase() + '</td>')
            var totalSelected = 0;
            extras[lab].forEach(function(group){
                log.push('<td>' + group  + ' : ');
                if(claims[group].length == 1){
                    log.push('YES</td>')
                    log.push('<td>Solo Claim</td>')
                    assignment[lab].push(group);
                    unassigned.remove(group);
                    totalSelected += 1;
                }else{
                    var labIndex = claims[group].indexOf(lab);
                    var indices = claims[group].map(function(lab){
                         return studentRanking[group].indexOf(lab);
                    });
                    var minLab = Math.min.apply(this,indices);
                    var minIndex = indices.indexOf(minLab);
                    if(labIndex == minIndex){
                        log.push('YES</td>')
                        assignment[lab].push(group);
                        unassigned.remove(group);
                        totalSelected += 1;
                    }else{
                        log.push('NO</td>')
                    }
                    var claimingLabs = [];
                    studentRanking[group].forEach(function(laboratory){
                        if(claims[group].indexOf(laboratory) !== -1){
                            if(laboratory == lab){
                                claimingLabs.push('<strong>' + laboratory + '</strong>')
                            }else{
                                claimingLabs.push(laboratory)
                            }
                        } 
                    });
                    log.push('<td>Student Preference: ' + claimingLabs.join(' &gt; ') + '</td>')
                }  
                log.push('</tr><tr>')
            });
            log.push('<th>Groups Acquired</th><th>' + totalSelected + '</th></tr>')
        };
    }


    if(unassigned.length == 0){
        log.push('<tr class="separator"><th colspan="3">No unassigned students left</th></tr>')
        log.push('<tr class="separator"><th colspan="3">No more randomization round needed = DONE!</th></tr>')
        console.log('No more randomization round needed..')
    }else{
        console.log('Randomize ' + unassigned.length + ' groups..')
        console.log('No. of random rounds:  ' + numRounds)
        // RANDOMIZE REMAINING
        log.push('<tr class="separator"><th colspan="3">Randomize ' + unassigned.length + ' groups</th></tr>')
        log.push('<tr><th colspan="3">No. of random rounds:  ' + numRounds + '</th></tr>')
        

        for(var i = 0; i < numRounds; i++){
            roundRandomize[i] = [];
        }
        labs.forEach(function(lab){
            for(var i = 0; i < numRounds; i++){
                roundRandomize[i].push(lab)
            }
        })

        log.push('<tr class="separator"><th colspan="3">Randomization Exemptions</th></tr>')
        var exemptCount = 0;
        labs.forEach(function(lab){
            var limit = Math.min(assignment[lab].length,numRounds);
            if(limit > 0){
                log.push('<tr><td>' + lab.toUpperCase() + '</td><td>exempt</td>')
                log.push('<td>' + limit + ' round(s) : Got ' + assignment[lab].length + ' group(s)</td></tr>')
            }
            for(var i = 0; i < limit; i++){
                roundRandomize[i].remove(lab) 
                exemptCount++;  
            }
        })

        if(exemptCount == 0){
            log.push('<tr><td colspan="3">None</td></tr>')
        }
        // for(var i = 0; i < unassigned.length; i++){
        //     var round = Math.floor(i / labs.length);

        //     console.log(roundRandomize[round]);
        //     console.log(roundRandomize[round].length);
        //     var randIndex = Math.floor(Math.random() * roundRandomize[round].length),
        //         randLab = roundRandomize[round][randIndex];
        //     console.log(randIndex);
        //     console.log('Assigned to..'  +randLab);
        //     assignment[randLab].push(unassigned[i]);
        //     roundRandomize[round].remove(randLab);
        // }  
        var lastRound = numRounds - 1;
        for(var i = 0; i < numRounds; i++){
            var roundAssignment = {};
            console.log('RandRound ' + (i+1));
            console.log('Randomize to ' + roundRandomize[i].length + ' labs..');
            console.log(roundRandomize[i]);
            if(i == lastRound){ // Randomly select lab to be assigned to remaining groups
                console.log(unassigned);
                for(var j = 0; j < unassigned.length; j++){
                    var randIndex = Math.floor(Math.random() * roundRandomize[i].length),
                        randLab = roundRandomize[i][randIndex];

                    var thisGroup = unassigned[j];
                    roundAssignment[randLab] = thisGroup;
                    assignment[randLab].push(thisGroup);
                    roundRandomize[i].remove(randLab);
                    console.log(randLab + ' randomly got ' + thisGroup);
                    console.log(roundRandomize[i])
                }
            }else{ // Not the last round, so all labs in roundRandomize[i] will be assigned to a group
                for(var j = 0; j < roundRandomize[i].length; j++){
                    var randIndex = Math.floor(Math.random() * unassigned.length),
                        randGroup = unassigned[randIndex];

                    var thisLab = roundRandomize[i][j]; 
                    roundAssignment[thisLab] = randGroup;
                    assignment[thisLab].push(randGroup);
                    unassigned.remove(randGroup);
                    console.log(thisLab + ' randomly got ' + randGroup);
                    console.log(unassigned)
                }
            }
            log.push('<tr class="separator"><th colspan="3">Randomization Round ' + (i+1) + '</th></tr>')
            labs.forEach(function(lab){
                log.push('<tr><td>' + lab.toUpperCase() + '</td>')
                if(roundRandomize[i].indexOf(lab) === -1 && roundAssignment[lab] === undefined){
                    log.push('<td>exempted</td>')
                }else{
                    log.push('<td>inRandom</td>')
                }
                if(roundAssignment[lab]){
                    log.push('<td>Randomly got group ' + roundAssignment[lab] + '</td>')
                }else{
                    log.push('<td>&nbsp;</td>')
                }
                log.push('</tr>')
            })
            console.log('-------')
        } 
    }


    // for(var lab in extras){
    //     extras[lab].forEach(function(group){
    //         assignment[lab].push(group)
    //     })
    // }
    return assignment;
};
exports.round3 = function(req,res){
    var labs = studentGroupModel.labs;
    var log = [];


    log.push('<tr class="separator"><th colspan="3">Round 3 Details</th></tr>')
    log.push('<tr><th>Lab</th><th>Action</th><th>Details</th></tr>')
    adminModel.getCurrentSemester(function(semester){
        labSettingModel.getAllAssignmentsAndExtra(semester,function(assignments,extras){
            var alreadyAssigned = [];
            for(var lab in assignments){
                assignments[lab].forEach(function(group){
                    alreadyAssigned.push(group);
                })
            }
            studentGroupModel.getStudentGroups(semester,function(err,studentGroups){
                var unassigned = [];
                var studentRanking = {};
                studentGroups.forEach(function(group){
                    if(alreadyAssigned.indexOf(group.number) === -1){
                        unassigned.push(group.number);
                        studentRanking[group.number] = group.ranking;
                    }
                });

                adminModel.updateCurrentMode('Round3',function(err){
                    if(err){
                        console.log(err);
                        return res.send("ERROR");
                    }

                    var assignment = distribute(unassigned,extras,studentRanking,labs,log);

                    var status = 'Done';
                    var labStatus = 'Done';
                    var details = log.join('\n');
                    // adminModel.updateCurrentMode(status,function(err){
                    adminModel.updateCurrentModeAndDetails(status,'3',details,function(err){
                        if(err){
                            console.log(err);
                            return res.send("ERROR");
                        }
                        labSettingModel.saveAssignment(semester,'3',assignment,null,null,labStatus,function(err){
                            if(err){
                                console.log(err);
                                return res.send("ERROR");
                            }else{
                                console.log("Successfully completed Round 3.");
                                return res.send("OK");
                            }
                        })
                    })
                });
                    
            });
        });
    });
};