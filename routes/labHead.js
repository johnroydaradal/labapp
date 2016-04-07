var studentGroupModel = require('../model/studentGroup'),
    adminModel = require('../model/admin'),
    labHeadModel = require('../model/labHead'),
    labSettingModel = require('../model/labSetting');


if(!studentGroupModel.USE_DB){
    var labSettingModel = require('../testModel/labSetting');
}

var NAME_SEPARATOR = '<br/>';

exports.viewLogin = function(req,res){
    res.render('labHeadLogin',{
        title: 'Login - Lab Head',
        messages: req.flash('info')
    });
};

exports.home = function(req,res){
    res.render('labHeadHome',{
        title: 'Home - Lab Head',
        messages: req.flash('info')
    });  
};

exports.root = function(req,res){
    if(req.session.labHeadId){
        exports.home(req,res); 
    }else{
        exports.viewLogin(req,res); 
    }   
};

exports.login = function(req,res){
    labHeadModel.authenticate(req.body.lab,req.body.password,function(isOk,labHead){
        if(isOk){
            req.session.labHeadId = labHead.id.toString();
            req.session.labName = labHead.lab;
        }else{
            req.flash('info','Wrong password.');
        }
        res.redirect('/');
    });
};

exports.logout = function(req,res){
    if(req.session.labHeadId){
        delete req.session.labHeadId;
        delete req.session.labName;
        req.flash('info','Successfully logged out.');
    }
    res.redirect('/');
};


exports.settings = function(req,res){
    res.render('labHeadSettings',{
        title: 'Settings - Lab Head',
        messages: req.flash('info')
    });  
};


exports.changePassword = function(req,res){
    labHeadModel.authenticate(req.session.labName,req.body.oldPassword,function(isOk,labHead){        
        if(isOk){
            labHeadModel.updatePassword(req.session.labName,req.body.newPassword,function(err){
                if(err){
                    req.flash('info',"Error: Couldn't update password this time.");
                }else{
                    req.flash('info','Successfully changed password.');
                }
                res.redirect('/settingsLabHead');
            });
        }else{
            req.flash('info',"Error: Incorrect password.");
            res.redirect('/settingsLabHead');
        }
    });
};


exports.getLabSlotsTable = function(req,res){
    var html = [];
    var lab = req.session.labName;
    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        labSettingModel.getLabSetting(currentSemester,lab,function(err,labSetting){
            if(!err){
                html.push('<p>Current Semester: ' + currentSemester + '</p>');
                if (labSetting){
                    html.push('<dl>');
                    html.push('<dt>Required</dt>');
                    html.push('<dd>' + labSetting.required + '</dd>');
                    html.push('<dt>Additional</dt>');
                    var additional = labSetting.additional || 0;
                    if(currentMode == 'SetSlots'){
                        html.push('<dd><input type="text" id="additional" value="' + additional + '" /></dd>');
                        html.push('</dl>');
                        html.push('<br/><button id="updateAdditionalLabSlots">Submit</button>');
                    }else{
                        html.push('<dd>' + labSetting.additional + '</dd>');
                        html.push('</dl>');
                    }
                    html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                }else{
                    html.push('<p>Minimum number of slots for your lab is not set yet. Please wait for the admin.</p>');   
                    html.push('<button id="refreshCapacity">Refresh</button>');
                }
                
                res.write(html.join('\n'));
                return res.end();
            }else{
                res.writeHead(500,'ERROR');
                return res.send('ERROR')
            }
        });
    });
};


exports.updateAdditionalLabSlots = function(req,res){
    var data = {
        semester: req.body.currentSemester,
        lab: req.session.labName,
        additional: req.body.additional
    };
    labSettingModel.updateAdditional(data,function(err){
        if(err){
            console.log(err);
            return res.send("ERROR");
        }else{
            console.log("Successfully updated required slots.");
            return res.send("OK");
        }
    });
};



exports.submitRankings = function(req,res){
    var data = {
        semester: req.body.currentSemester,
        lab: req.session.labName,
        nextMode: req.body.nextMode,
        currentRound: req.body.currentRound,
        ranking: req.body.ranking
    };
    labSettingModel.addRanking(data,function(err){
        if(err){
            console.log(err);
            return res.send("ERROR");
        }else{
            console.log("Successfully added rankings.");
            return res.send("OK");
        }
    });
};

exports.submitExtra = function(req,res){
    var data = {
        semester: req.body.currentSemester,
        lab: req.session.labName,
        nextMode: req.body.nextMode,
        extra: req.body.extra
    };
    labSettingModel.addExtra(data,function(err){
        if(err){
            console.log(err);
            return res.send("ERROR");
        }else{
            console.log("Successfully added extra.");
            return res.send("OK");
        }
    });
};



exports.getRound1 = function(req,res){
    var html = [];
    var lab = req.session.labName;
    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        if(currentMode == 'SetSlots'){
            html.push('<p>Preference table not yet finalized. Please wait for the admin.</p>');   
            html.push('<button id="refreshRound1">Refresh</button>');   
            res.write(html.join('\n'));
            return res.end();
        }else if(currentMode == 'Rank1'){
            labSettingModel.getCurrentMode(currentSemester,lab,function(labMode){
                if(labMode === undefined || labMode === 'Round1Rank'){
                    labSettingModel.getTotalSlots(currentSemester,function(err,totalSlots){
                        var quota = Math.floor(0.6 * totalSlots[lab]);
                        studentGroupModel.getAllRankingsAndGroups(currentSemester,function(err,allRankings,groupSizes,groupNames,groupNumbers){
                            labSettingModel.getColorTable(currentSemester,function(err,colorTable){
                                var i = 0;
                                var rankTotal = 0;
                                html.push('<div id="rankCount"><p>Ranked Students: ');
                                html.push('<label id="rankTotal">' + rankTotal + '</label> out of');
                                html.push('<label id="rankLimit">' + quota + '</label></p>');
                                var buttonClass = '';
                                // if(rankTotal < quota){ buttonClass = 'hidden' }
                                // EDIT: May 7 (Temporarily disable save button)
                                html.push('<button id="saveRanking" class="' + buttonClass + '">Submit</button></div>')
                                html.push('<table>');
                                html.push('<tr><th>Group</th><th>Members</th><th>Rank</th></tr>')
                                colorTable[lab].forEach(function(color){
                                    if(color != 'w'){
                                        var multiplier;
                                        if(color == 'g'){ multiplier = 1; }
                                        if(color == 'y'){ multiplier = 0.5; }
                                        html.push('<tr>');
                                        html.push('<td class="' + color + '">' + groupNumbers[i] + '</td>');
                                        html.push('<td class="' + color + '">' + groupNames[i].toUpperCase() + '</td>');
                                        // EDIT: May 7 (Temporarily disable text boxes)
                                        html.push('<td><input type="text" id="rank_' + groupNumbers[i] + '" />');
                                        html.push('<input type="hidden" value="' + groupSizes[i] + '" />');
                                        html.push('<input type="hidden" value="' + multiplier + '" />');
                                        html.push('</td></tr>');
                                    }
                                    i++;
                                });
                                html.push('</table>');
                                html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                                html.push('<input type="hidden" id="nextMode" value="Round1Ready" />');
                                html.push('<input type="hidden" id="currentRound" value="Round1" />');
                                res.write(html.join('\n'));
                                return res.end();
                            });
                        });
                        
                    });
                }else if(labMode == 'Round1Ready'){
                    studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
                        var names = {};
                        studentGroups.forEach(function(group){
                            names[group.number] =  group.names.join(NAME_SEPARATOR).toUpperCase();
                        });
                        labSettingModel.getRankings(currentSemester,function(err,rankings){
                            html.push('<p>Waiting for Round 1 results..</p>');
                            html.push('<button id="refreshRound1">Refresh</button>');
                            html.push('<br/><br/><table>');
                            html.push('<tr><th colspan="3">Your Ranking</th></tr>');
                            html.push('<tr><th>Rank</th><th>Group</th><th>Members</th></tr>');
                            var rank = 1;
                            rankings[lab].forEach(function(group){
                                html.push('<tr>');
                                html.push('<td>' + rank + '</td>');
                                html.push('<td>' + group + '</td>');
                                html.push('<td>' + names[group] + '</td>');
                                html.push('</tr>');
                                rank++;
                            });
                            html.push('</table>');
                            res.write(html.join('\n'));
                            return res.end();
                        });
                    
                    });
                }
            });
        }else{
            
                labSettingModel.getRoundRanking(currentSemester,lab,1,function(ranking){
                labSettingModel.getAssignments(currentSemester,'1',function(assignments){
                    // studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
                    studentGroupModel.getAllRankingsAndGroups(currentSemester,function(err,allRankings,groupSizes,groupNames,groupNumbers){
                    labSettingModel.getColorTable(currentSemester,function(err,colorTable){
                    labSettingModel.getCurrentModeAndRerank(currentSemester,lab,function(labMode,rerankNeeded){
                        if(err){
                            console.log(err);
                            return res.send("ERROR");
                        }
                        // var names = {},
                        //     groupCount = {};
                        // studentGroups.forEach(function(group){
                        //     names[group.number] =  group.names.join(' / ').toUpperCase();
                        //     groupCount[group.number] = group.names.length;
                        // });
                        var html = [];

                        var numGroups = ranking.length,
                            totalStudents = 0;
                        assignments[lab].forEach(function(group){
                            // totalStudents += groupCount[group]; 
                            var idx = groupNumbers.indexOf(group);
                            totalStudents += groupSizes[idx];
                        });

                        var assignedGroups = [];
                        for(var k in assignments){
                            assignments[k].forEach(function(group){
                                assignedGroups.push(group); 
                            });
                        }
                        if(currentMode == 'Rerank1'){
                            if(labMode == 'Round1Rerank' && rerankNeeded > 0){
                                html.push('<p>You need to  <label id="rerank1" class="rerank">rerank</label>..</p>')
                            }else{
                                html.push('<p>Round 1 is still ongoing..Please wait..<br/><button id="refreshRound1">Refresh</button></p>')
                            }
                        }else{
                            html.push('<table>');
                            html.push('<tr><th colspan="4">Results</th></tr>');
                            html.push('<tr><th colspan="4">Total: ' + totalStudents + '</th></tr>');
                            html.push('<tr><th>Rank</th><th>Group</th><th>Members</th><th>Acquired?</th></tr>');
                            var rank = 1;
                            ranking.forEach(function(group){
                                var idx = groupNumbers.indexOf(group);
                                var color = colorTable[lab][idx];
                                html.push('<tr>'); 
                                html.push('<td class="' + color + '">' + rank + '</td>');
                                html.push('<td class="' + color + '">' + group + '</td>');
                                html.push('<td class="' + color + '">' + groupNames[idx].toUpperCase() + '</td>');
                                if(assignedGroups.indexOf(group) === -1){ // Nobody got the group
                                    html.push('<td class="w">-</td>');
                                }else if(assignments[lab].indexOf(group) === -1){ // You didn't get the group
                                    html.push('<td class="r">No</td>');
                                }else{
                                    html.push('<td class="g">Yes</td>');
                                }
                                html.push('</tr>'); 
                                rank++;
                            });
                            html.push('</table>');
                        }
                        res.write(html.join('\n'));
                        res.end();
                    });
                    });
                    });
                });
                });
        }
    });
};


exports.getRound2 = function(req,res){
    var html = [];
    var lab = req.session.labName,
        labs = studentGroupModel.labs,
        labIndex = labs.indexOf(lab);

    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        var preModes = ['SetSlots','Rank1','Round1','Rerank1'];
        if(preModes.indexOf(currentMode) !== -1){
            html.push('<p>Please wait for Round 1 to finish.</p>')
            res.write(html.join('\n'));
            return res.end();
        }else if(currentMode == 'Rank2'){
            labSettingModel.getCurrentMode(currentSemester,lab,function(labMode){
                if(labMode === 'Round2Rank'){
                    labSettingModel.getLackingData(currentSemester,function(lackings,assignments,rankings){
                        var lacking = lackings[lab],
                            assignment = assignments[lab],
                            existingRanking = rankings[lab];

                        var alreadyAssigned = [];
                        for(var k in assignments){
                            assignments[k].forEach(function(group){
                                alreadyAssigned.push(group);
                            })
                        }

                        studentGroupModel.getAllRankingsAndGroups(currentSemester,function(err,allRankings,groupSizes,groupNames,groupNumbers){
                            var unusedRanking = [],
                                totalUnused = 0;

                            var existingIndices = [];
                            existingRanking.forEach(function(group){
                                var idx = groupNumbers.indexOf(group);
                                if(alreadyAssigned.indexOf(group) === -1){
                                    existingIndices.push(idx);
                                    unusedRanking.push(group);
                                    // totalUnused += groupSizes[idx];
                                } 
                            });

                            // var rankDiscount = 0.5 * totalUnused;

                            labSettingModel.getColorTable(currentSemester,function(err,colorTable){
                                var rankTotal = 0;
                                for(var i = 0; i < existingIndices.length; i++){
                                    var idx = existingIndices[i];
                                    var multiplier = 0.5;
                                    if(colorTable[lab][idx] === 'g'){
                                        multiplier = 1;
                                    }
                                    totalUnused += (multiplier * groupSizes[idx]);
                                }
                                console.log('Lacking:' + lacking + ' , Total Unused:' + totalUnused);
                                var quota = lacking - totalUnused;
                                html.push('<div id="rankCount"><p>Ranked Students: ');
                                html.push('<label id="rankTotal">' + rankTotal + '</label> out of');
                                html.push('<label id="rankLimit">' + quota + '</label></p>');
                                var buttonClass = '';
                                // if(rankTotal < quota){ buttonClass = 'hidden' }
                                html.push('<button id="saveRanking" class="' + buttonClass + '">Submit</button></div>')
                                html.push('<table>');
                                html.push('<tr><th>Group</th><th>Members</th><th>Rank</th></tr>')
                                var forRanking = [];
                                var totalPossible = 0;
                                var whiteStudents = [];
                                var i = 0;
                                colorTable[lab].forEach(function(color){
                                    var group = groupNumbers[i];
                                    if(color != 'w'){
                                        if (alreadyAssigned.indexOf(group) === -1 && existingRanking.indexOf(group) === -1){
                                            forRanking.push(i);    
                                            var multiplier;
                                            if(color == 'g'){ multiplier = 1; }
                                            if(color == 'y'){ multiplier = 0.5; } 
                                            totalPossible += (multiplier * groupSizes[i]);   
                                        }
                                    }else{
                                        whiteStudents.push(i);
                                    }
                                    i++;
                                });
                                console.log('TotPossible - Quota - Lacking');
                                console.log(totalPossible + ' vs. ' + quota + ' vs. ' + lacking);
                                console.log('WhiteStudents:' + whiteStudents.length);
                                var labRatings = allRankings.map(function(ranking){
                                    return ranking[labIndex];
                                });
                                if(totalPossible < quota){
                                    var otherRatings = [],
                                        whiteData = [];
                                    whiteStudents.forEach(function(i){
                                        otherRatings.addToSet(labRatings[i]);
                                        whiteData.push([i,groupNumbers[i],labRatings[i]]);
                                    });
                                    otherRatings.sort();
                                    console.log('OtherRatings');
                                    console.log(otherRatings);
                                    console.log('whiteData');
                                    console.log(whiteData);
                                    for(var i = 0; i < otherRatings.length; i++){
                                        var rating = otherRatings[i];
                                        whiteData.filter(function(triple){
                                            return triple[2] == rating;
                                        }).map(function(triple){
                                            return triple[0];
                                        }).forEach(function(i){
                                            var group = groupNumbers[i]
                                            if (alreadyAssigned.indexOf(group) === -1 && existingRanking.indexOf(group) === -1){
                                                forRanking.push(i);
                                                totalPossible += 0.5 * groupSizes[i];
                                            }   
                                        });
                                        if(totalPossible >= quota){
                                            console.log('Stopped adding at ' + rating);
                                            break;
                                        }

                                    }
                                    console.log('UPDATED: TotPossible - Quota - Lacking');
                                    console.log(totalPossible + ' vs. ' + quota + ' vs. ' + lacking);
                                }
                                for(var idx=0; idx < existingIndices.length; idx++){
                                    var i = existingIndices[idx],
                                        color = colorTable[lab][i];
                                    html.push('<tr>');
                                    html.push('<td class="' + color + '">' + groupNumbers[i] + '</td>');
                                    html.push('<td class="' + color + '">' + groupNames[i].toUpperCase() + '</td>');
                                    html.push('<td>' + (idx+1) + '</dt>');
                                    html.push('</tr>');
                                }

                                for(var idx=0; idx < forRanking.length; idx++){
                                    var i = forRanking[idx],
                                        color = colorTable[lab][i];
                                    var multiplier;
                                    if(color == 'g'){ multiplier = 1; }
                                    if(color == 'y'){ multiplier = 0.5; }
                                    if(color == 'w'){ multiplier = 0.5; }
                                    html.push('<tr>');
                                    html.push('<td class="' + color + '">' + groupNumbers[i] + '</td>');
                                    html.push('<td class="' + color + '">' + groupNames[i].toUpperCase() + '</td>');
                                    html.push('<td><input type="text" id="rank_' + groupNumbers[i] + '" />');
                                    html.push('<input type="hidden" value="' + groupSizes[i] + '" />');
                                    html.push('<input type="hidden" value="' + multiplier + '" />');
                                    html.push('</td></tr>');
                                }
                                html.push('</table>');
                                html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                                html.push('<input type="hidden" id="nextMode" value="Round2Ready" />');
                                html.push('<input type="hidden" id="currentRound" value="Round2" />');
                                res.write(html.join('\n'));
                                return res.end();
                            });
                        });
                        
                    });
                }else if(labMode == 'Round2Ready'){
                    labSettingModel.getAssignments(currentSemester,'1',function(assignments){
                        var alreadyAssigned = [];
                        for(var k in assignments){
                            assignments[k].forEach(function(group){
                                alreadyAssigned.push(group); 
                            });
                        }
                        studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
                            var names = {};
                            studentGroups.forEach(function(group){
                                names[group.number] =  group.names.join(NAME_SEPARATOR).toUpperCase();
                            });
                            labSettingModel.getRankings(currentSemester,function(err,rankings){
                                html.push('<p>Waiting for Round 2 results..</p>');
                                html.push('<button id="refreshRound2">Refresh</button>');
                                html.push('<br/><br/><table>');
                                html.push('<tr><th colspan="3">Your Ranking</th></tr>');
                                html.push('<tr><th>Rank</th><th>Group</th><th>Members</th></tr>');
                                var rank = 1;
                                rankings[lab].forEach(function(group){
                                    if(alreadyAssigned.indexOf(group) === -1){
                                        html.push('<tr>');
                                        html.push('<td>' + rank + '</td>');
                                        html.push('<td>' + group + '</td>');
                                        html.push('<td>' + names[group] + '</td>');
                                        html.push('</tr>');
                                        rank++;
                                    }
                                });
                                html.push('</table>');
                                res.write(html.join('\n'));
                                return res.end();
                            });
                        
                        });
                    });

                }
            });
        }else{
            labSettingModel.getAssignments(currentSemester,'1',function(assignments1){
            labSettingModel.getAssignments(currentSemester,'2',function(assignments2){
                var alreadyAssigned1 = [];
                for(var k in assignments1){
                    assignments1[k].forEach(function(group){
                        alreadyAssigned1.push(group); 
                    });
                }
                var alreadyAssigned2 = [];
                var totalAssigned = 0;
                for(var k in assignments2){
                    var a = assignments2[k] || [];
                    a.forEach(function(group){
                        alreadyAssigned2.push(group); 
                    });
                    totalAssigned += a.length;
                }
                // studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
                if(totalAssigned > 0){
                    studentGroupModel.getAllRankingsAndGroups(currentSemester,function(err,allRankings,groupSizes,groupNames,groupNumbers){
                    labSettingModel.getColorTable(currentSemester,function(err,colorTable){
                    labSettingModel.getCurrentModeAndRerank(currentSemester,lab,function(labMode,rerankNeeded){

                        var totalStudents = 0;
                        assignments2[lab].forEach(function(group){
                            // totalStudents += groupCount[group]; 
                            var idx = groupNumbers.indexOf(group);
                            totalStudents += groupSizes[idx];
                        });

                        labSettingModel.getRankings(currentSemester,function(err,rankings){

                            if(currentMode == 'Rerank2'){
                                if(labMode == 'Round2Rerank' && rerankNeeded > 0){
                                    html.push('<p>You need to <label id="rerank2" class="rerank">rerank</label>..</p>')
                                }else{
                                    html.push('<p>Round 2 is still ongoing..Please wait<br/><button id="refreshRound2">Refresh</button></p>')
                                }
                            }else{
                                html.push('<table>');
                                html.push('<tr><th colspan="4">Results</th></tr>');
                                html.push('<tr><th colspan="4">Total: ' + totalStudents + '</th></tr>');
                                html.push('<tr><th>Rank</th><th>Group</th><th>Members</th><th>Acquired?</th></tr>');
                                var rank = 1;
                                rankings[lab].forEach(function(group){
                                    // Only those not assigned in previous round
                                    var idx = groupNumbers.indexOf(group);
                                    var color = colorTable[lab][idx]; 
                                    if(alreadyAssigned1.indexOf(group) === -1){
                                        html.push('<tr>'); 
                                        html.push('<td class="' + color + '">' + rank + '</td>');
                                        html.push('<td class="' + color + '">' + group + '</td>');
                                        html.push('<td class="' + color + '">' + groupNames[idx].toUpperCase() + '</td>');
                                        if(alreadyAssigned2.indexOf(group) === -1){ // Nobody got the group
                                            html.push('<td class="w">-</td>');
                                        }else if(assignments2[lab].indexOf(group) === -1){ // You didn't get the group
                                            html.push('<td class="r">No</td>');
                                        }else{
                                            html.push('<td class="g">Yes</td>');
                                        }
                                        html.push('</tr>'); 
                                        rank++;
                                    }
                                });
                                html.push('</table>');

                            }
                            res.write(html.join('\n'));
                            return res.end();
                        });
                    });
                    });
                    });
                }else{
                    html.push('<p>No need for Round 2. All students were already assigned. </p>')
                    res.write(html.join('\n'));
                    return res.end();
                }
            });
            });
        }
    });
};


exports.getRound3 = function(req,res){
    var html = [];
    var lab = req.session.labName,
        labs = studentGroupModel.labs,
        labIndex = labs.indexOf(lab);

    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        var preModes = ['SetSlots','Rank1','Round1','Rerank1','Rank2','Round2','Rerank2'];
        if(preModes.indexOf(currentMode) !== -1){
            html.push('<p>Please wait for Round 2 to finish.</p>')
            res.write(html.join('\n'));
            return res.end();
        }else if(currentMode == 'Rank3'){
            labSettingModel.getCurrentMode(currentSemester,lab,function(labMode){
                if(labMode === 'Round3Pick'){
                    labSettingModel.getAllAssignmentsAndExtra(currentSemester,function(assignments,extras){
                        var alreadyAssigned = [];
                        for(var k in assignments){
                            assignments[k].forEach(function(group){
                                alreadyAssigned.push(group);
                            })
                        }
                        // for(var k in extras){
                        //     extras[k].forEach(function(group){
                        //         alreadyAssigned.push(group); 
                        //     });
                        // }

                        studentGroupModel.getAllRankingsAndGroups(currentSemester,function(err,allRankings,groupSizes,groupNames,groupNumbers){
                        
                            labSettingModel.getColorTable(currentSemester,function(err,colorTable){
                                var i = 0;
                                html.push('<div id="rankCount"><p>Pick remaining students?</p>');
                                html.push('<button id="saveExtra">Submit</button></div>')
                                html.push('<table>');
                                html.push('<tr><th>Group</th><th>Members</th><th>Pick</th></tr>')
                                var forPicking = [];
                                colorTable[lab].forEach(function(color){
                                    var group = groupNumbers[i];
                                    if (alreadyAssigned.indexOf(group) === -1){
                                        forPicking.push(i);   
                                    }
                                    i++;
                                });
                                for(var idx=0; idx < forPicking.length; idx++){
                                    var i = forPicking[idx],
                                        color = colorTable[lab][i];
                                    html.push('<tr>');
                                    html.push('<td class="' + color + '">' + groupNumbers[i] + '</td>');
                                    html.push('<td class="' + color + '">' + groupNames[i].toUpperCase() + '</td>');
                                    html.push('<td><input type="checkbox" id="pick_' + groupNumbers[i] + '" />');
                                    html.push('</td></tr>');
                                }
                                html.push('</table>');
                                html.push('<p>Note: Picked groups will not be automatically assigned to you if more than one lab is interested in the group. The preferred lab by the group will be prioritized.')
                                html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                                html.push('<input type="hidden" id="nextMode" value="Round3Ready" />');
                                html.push('<input type="hidden" id="currentRound" value="Round3" />');
                                res.write(html.join('\n'));
                                return res.end();
                            });
                        });
                        
                    });
                }else if(labMode == 'Round3Ready'){
                    studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
                        var names = {};
                        studentGroups.forEach(function(group){
                            names[group.number] =  group.names.join(NAME_SEPARATOR).toUpperCase();
                        });
                        // labSettingModel.getRankings(currentSemester,function(err,rankings){
                        labSettingModel.getAllAssignmentsAndExtra(currentSemester,function(assignments,extras){
                            html.push('<p>Waiting for Round 3 results..</p>');
                            html.push('<button id="refreshRound3">Refresh</button>');
                            html.push('<br/><br/><table>');
                            html.push('<tr><th colspan="2">Your Picks</th></tr>');
                            var count = 0;
                            extras[lab].forEach(function(group){
                                html.push('<tr>');
                                html.push('<td>' + group + '</td>');
                                html.push('<td>' + names[group] + '</td>');
                                html.push('</tr>');
                                count += 1;
                            });
                            if(count == 0){
                                html.push('<tr><td colspan="2">None</td></tr>');
                            }
                            html.push('</table>');
                            res.write(html.join('\n'));
                            return res.end();
                        });
                    
                    });
                }
            });
        }else{
            labSettingModel.getExtra(currentSemester,lab,function(extra){
            labSettingModel.getAssignments(currentSemester,'3',function(assignments){
                var totalAssigned = 0;
                for(var k in assignments){
                    var a = assignments[k] || [];
                    totalAssigned += a.length;
                }
                if(totalAssigned > 0){
                    // studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
                    studentGroupModel.getAllRankingsAndGroups(currentSemester,function(err,allRankings,groupSizes,groupNames,groupNumbers){
                    labSettingModel.getColorTable(currentSemester,function(err,colorTable){
                        if(err){
                            console.log(err);
                            return res.send("ERROR");
                        }
                        var html = [];

                        var totalStudents = 0;
                        assignments[lab].forEach(function(group){
                            var idx = groupNumbers.indexOf(group);
                            totalStudents += groupSizes[idx]; 
                        });
                        html.push('<table>');
                        html.push('<tr><th colspan="3">Results</th></tr>');
                        html.push('<tr><th colspan="3">Total: ' + totalStudents + '</th></tr>');
                        if(extra.length == 0 && assignments[lab].length == 0){
                            // No manually picked + No assigned students
                            html.push('<tr><td colspan="3">None</td></tr>');
                        }else if(extra.length == 0){
                            // No manually picked + With assigned students (Random)
                            html.push('<tr><th>Group</th><th>Members</th><th>Acquired?</th></tr>');
                            assignments[lab].sort().forEach(function(group){
                                var idx = groupNumbers.indexOf(group);
                                var color = colorTable[lab][idx]; 
                                html.push('<tr>'); 
                                html.push('<td class="' + color + '">' + group + '</td>');
                                html.push('<td class="' + color + '">' + groupNames[idx].toUpperCase() + '</td>');
                                html.push('<td class="g">Rand</td>');
                                html.push('</tr>'); 
                            });
                        }else{
                            // With manually picked + With/without assigned students
                            html.push('<tr><th>Group</th><th>Members</th><th>Acquired?</th></tr>');
                            var groups = [];
                            extra.forEach(function(group){
                                groups.push(group);
                            })
                            assignments[lab].forEach(function(group){
                                groups.addToSet(group);
                            })
                            groups.sort().forEach(function(group){
                                var idx = groupNumbers.indexOf(group);
                                var color = colorTable[lab][idx]; 
                                html.push('<tr>'); 
                                html.push('<td class="' + color + '">' + group + '</td>');
                                html.push('<td class="' + color + '">' + groupNames[idx].toUpperCase() + '</td>');
                                if(extra.indexOf(group) === -1){ // You didn't manually pick group, so randomized
                                    html.push('<td class="g">Rand</td>');
                                }else{ // Manually picked group
                                    if(assignments[lab].indexOf(group) === -1){ // You didn't get the group
                                        html.push('<td class="r">No</td>');
                                    }else{
                                        html.push('<td class="g">Yes</td>');
                                    }
                                }
                                html.push('</tr>'); 
                            });
                        }
                        html.push('</table>');
                        res.write(html.join('\n'));
                        res.end();
                    });
                    });
                }else{
                    html.push('<p>No need for Round 3. All students were already assigned. </p>')
                    res.write(html.join('\n'));
                    res.end();
                }
            });
            });
        }
    });
};

exports.getResults = function(req,res){
    var thisLab = req.session.labName;

    adminModel.getCurrentSemester(function(currentSemester){
        labSettingModel.getLabResults(currentSemester,thisLab,function(assignment,totalSlots){
            studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
                if(err){
                    console.log(err);
                    return res.send("ERROR");
                }
                var names = {},
                    groupCount = {};
                studentGroups.forEach(function(group){
                    names[group.number] =  group.names.join(NAME_SEPARATOR).toUpperCase();
                    groupCount[group.number] = group.names.length;
                });
                var html = [];

                var totalStudents = 0;
                var myGroups = []
                for(var round in assignment){
                    assignment[round].forEach(function(group){
                        totalStudents += groupCount[group];
                        myGroups.push([group,round]);
                    })
                }
                myGroups.sort();
                html.push('<table>');
                html.push('<tr><th colspan="3">Results</th></tr>');
                html.push('<tr><th colspan="3">Total: ' + totalStudents + ' out of ' + totalSlots + '</th></tr>');
                if(totalStudents == 0){
                    html.push('<tr><td colspan="3">No groups taken yet.</td></tr>');
                }else{
                    html.push('<tr><th>Group</th><th>Members</th><th>Round</th></tr>');
                    for(var i = 0; i < myGroups.length; i++){
                        var pair = myGroups[i],
                            group = pair[0],
                            round = pair[1];
                        html.push('<tr>')
                        html.push('<td>' + group + '</td>')
                        html.push('<td>' + names[group] + '</td>')
                        html.push('<td>' + round + '</td>')
                        html.push('</tr>')
                    }
                }
                html.push('</table>');
                res.write(html.join('\n'));
                res.end();
            });
        });
    });
};

