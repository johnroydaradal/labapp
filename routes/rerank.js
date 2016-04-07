var studentGroupModel = require('../model/studentGroup'),
    adminModel = require('../model/admin'),
    labSettingModel = require('../model/labSetting');

if(!studentGroupModel.USE_DB){
    var labSettingModel = require('../testModel/labSetting');
}

var getRerank = function(roundNum,req,res){
    var html = [];
    var lab = req.session.labName,
        labs = studentGroupModel.labs,
        labIndex = labs.indexOf(lab);

    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        labSettingModel.getCurrentMode(currentSemester,lab,function(labMode){
            if(labMode === 'Round' + roundNum + 'Rerank'){
                labSettingModel.getRerankData(roundNum,currentSemester,function(reranksNeeded,lackings,assignments,rankings,rerankLabs){
                    var lacking = reranksNeeded[lab],
                        assignment = assignments[lab],
                        existingRanking = rankings[lab];

                    var alreadyAssigned = [];
                    for(var k in assignments){
                        assignments[k].forEach(function(group){
                            alreadyAssigned.push(group);
                        })
                    }

                    studentGroupModel.getAllRankingsAndGroups(currentSemester,function(err,allRankings,groupSizes,groupNames,groupNumbers){

                        labSettingModel.getColorTable(currentSemester,function(err,colorTable){
                            var rankTotal = 0;
                            console.log('Lacking:' + lacking);
                            var quota = lacking;
                            html.push('<div id="rankCount"><p>Ranked Students: ');
                            html.push('<label id="rankTotal">' + rankTotal + '</label> out of');
                            html.push('<label id="rankLimit">' + quota + '</label></p>');
                            var buttonClass = '';
                            // if(rankTotal < quota){ buttonClass = 'hidden' }
                            html.push('<button id="saveRanking" class="' + buttonClass + '">Save</button></div>')
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
                            console.log('TotPossible - Quota');
                            console.log(totalPossible + ' vs. ' + quota);
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
                                console.log('UPDATED: TotPossible - Quota');
                                console.log(totalPossible + ' vs. ' + quota);
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
                            html.push('<input type="hidden" id="nextMode" value="Round' + roundNum + 'Ready" />');
                            html.push('<input type="hidden" id="currentRound" value="Round' + roundNum + '" />');
                            res.write(html.join('\n'));
                            return res.end();
                        });
                    });
                    
                });
            }else{
                res.write("<p>You don't need to rerank for round " + roundNum + ".</p>");
                return res.end();
            }
        });
    });  
};

exports.getRerank1 = function(req,res){
    getRerank('1',req,res);  
};

exports.getRerank2 = function(req,res){
    getRerank('2',req,res);  
};