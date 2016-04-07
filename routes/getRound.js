var studentGroupModel = require('../model/studentGroup'),
    adminModel = require('../model/admin'),
    labSettingModel = require('../model/labSetting');


if(!studentGroupModel.USE_DB){
    var labSettingModel = require('../testModel/labSetting');
}
var NAME_SEPARATOR = '<br/>';

var displayResults = function(show,currentSemester,roundNum,html,res){
    adminModel.getRoundDetails(roundNum,function(details){
    labSettingModel.getAssignments(currentSemester,roundNum,function(assignments){
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
            var totalAssigned = 0;
            for(var lab in assignments){
                var a = assignments[lab] || [];
                totalAssigned += a.length;
            }
            if(totalAssigned > 0 || roundNum == '1'){
                var divClass = '';
                var button = '<button id="resetRound' + roundNum + '">Reset Round ' + roundNum + '</button>';
                button += '<label class="clickable yellow" id="viewDetails">View Details</label><br/><br/>'
                if(!show){
                    divClass = 'hidden';
                    var button = '<button id="resultsToggle">Show Results</button><br/><br/>'; 
                }
                html.push(button);
                html.push('<div id="resultsDiv" class="' + divClass + '">')
                html.push('<table>');
                html.push('<tr><th colspan="4">Results</th></tr>');
                html.push('<tr><th>Lab</th><th>Group</th><th>Members</th><th>Total</th></tr>');
                var labCount = 0;
                for(var lab in assignments){
                    var color = 'w';
                    if(labCount % 2 == 0){ color = 'b'; }
                    var numGroups = assignments[lab].length,
                        rowSpan = numGroups || 1,
                        totalStudents = 0;
                    assignments[lab].forEach(function(group){
                        totalStudents += groupCount[group]; 
                    });
                    html.push('<tr class="' + color + '">')
                    html.push('<td rowspan="' + rowSpan + '">' + lab.toUpperCase() + '</td>');
                    if(numGroups > 0){
                        html.push('<td>' + assignments[lab][0] + '</td>')
                        html.push('<td>' + names[assignments[lab][0]] + '</td>')
                    }else{
                        html.push('<td>&nbsp;</td>')
                        html.push('<td>&nbsp;</td>')
                    }
                    html.push('<td rowspan="' + rowSpan + '">' + totalStudents + '</td>');
                    html.push('</tr>');
                    for(var i = 1; i < numGroups; i++){
                        html.push('<tr class="' + color + '">')
                        html.push('<td>' + assignments[lab][i] + '</td>')
                        html.push('<td>' + names[assignments[lab][i]] + '</td>')
                        html.push('</tr>')
                    }
                    labCount++;
                }
                html.push('</table>');
                html.push('</div>');
                // console.log(details);
                html.push('<div style="display:none" id="roundDetails"><table>' + details + '</table></div>')
            }else{
                html.push('<p>No need for Round 2. All students were already assigned. </p>')
            }      
            res.write(html.join('\n'));
            res.end();
        });
    });
    });
};


exports.round1 = function(req,res){
    var html = [];
    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        if(currentMode == 'SetSlots'){
            res.write('<p>Please set up preference table first.</p>');
            return res.end();
        }else if(currentMode == 'Rank1'){
            labSettingModel.getCurrentModes(currentSemester,function(currentMode){
                var html = [];
                html.push('<table>');
                html.push('<tr><th>Lab</th><th>Has Ranked?</th></tr>');
                var showButton = true;
                for(var lab in currentMode){
                    var hasRanked = '';
                    if(currentMode[lab] == 'Round1Ready'){
                        hasRanked = 'YES';
                    }else{
                        showButton = false;
                    }
                    html.push('<tr>');
                    html.push('<td>' + lab.toUpperCase() + '</td>');
                    html.push('<td>' + hasRanked + '</td>');
                    html.push('</tr>');
                } 
                html.push('</table>');
                if(showButton){
                    html.push('<br/><button id="startRound1">Start Round 1</button>');
                    html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                    html.push('<input type="hidden" id="nextMode" value="Round1" />');   
                }else{
                    html.push('<br/><button id="refreshRound1">Refresh</button>');
                }
                res.write(html.join('\n'));
                res.end();
            });
        }else{ // The rest of the modes
            // Show Round 1 results
            if(currentMode == 'Rerank1'){
                // Show table of labs who needs reranking; Refresh button or Continue button
                labSettingModel.getRerankLabs(currentSemester,'1',function(rerankLabs){
                    var html = [];
                    html.push('<table>');
                    html.push('<tr><th colspan="2">Needs Reranking</th></tr>');
                    html.push('<tr><th>Lab</th><th>Has Reranked?</th></tr>');
                    var showButton = true;
                    for(var lab in rerankLabs){
                        var hasReranked = '';
                        if(rerankLabs[lab] == 'Round1Ready'){
                            hasReranked = 'YES';
                        }else{
                            showButton = false;
                        }
                        html.push('<tr>');
                        html.push('<td>' + lab.toUpperCase() + '</td>');
                        html.push('<td>' + hasReranked + '</td>');
                        html.push('</tr>');
                    } 
                    html.push('</table>');
                    if(showButton){
                        html.push('<button id="resumeRound1">Resume Round 1</button><br/><br/>');
                        html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                        html.push('<input type="hidden" id="nextMode" value="Rerank1" />');   
                    }else{
                        html.push('<button id="refreshRound1">Refresh</button><br/><br/>');
                    }
                    displayResults(false,currentSemester,'1',html,res);  
                });
            }else{
                var html = [];
                displayResults(true,currentSemester,'1',html,res);
            }
        }
    });
};


exports.round2 = function(req,res){
    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        var preModes = ['SetSlots','Rank1','Round1','Rerank1'];
        if(preModes.indexOf(currentMode) !== -1){
            res.write('<p>Please finish Round 1 first.</p>');
            return res.end();
        }else if(currentMode == 'Rank2'){
            labSettingModel.getCurrentModes(currentSemester,function(currentMode){
                var html = [];
                html.push('<table>');
                html.push('<tr><th>Lab</th><th>Has Ranked?</th></tr>');
                var showButton = true;
                for(var lab in currentMode){
                    var hasRanked = '';
                    if(currentMode[lab] == 'Round2Ready'){
                        hasRanked = 'YES';
                    }else{
                        showButton = false;
                    }
                    html.push('<tr>');
                    html.push('<td>' + lab.toUpperCase() + '</td>');
                    html.push('<td>' + hasRanked + '</td>');
                    html.push('</tr>');
                } 
                html.push('</table>');
                if(showButton){
                    html.push('<br/><button id="startRound2">Start Round 2</button>');
                    html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                    html.push('<input type="hidden" id="nextMode" value="Round2" />');   
                }else{
                    html.push('<br/><button id="refreshRound2">Refresh</button>');
                }
                res.write(html.join('\n'));
                res.end();
            });
        }else{ // The rest of the modes
            // Show Round 2 results
            if(currentMode == 'Rerank2'){
                // Show table of labs who needs reranking; Refresh button or Continue button
                labSettingModel.getRerankLabs(currentSemester,'2',function(rerankLabs){
                    var html = [];
                    html.push('<table>');
                    html.push('<tr><th colspan="2">Needs Reranking</th></tr>');
                    html.push('<tr><th>Lab</th><th>Has Reranked?</th></tr>');
                    var showButton = true;
                    for(var lab in rerankLabs){
                        var hasReranked = '';
                        if(rerankLabs[lab] == 'Round2Ready'){
                            hasReranked = 'YES';
                        }else{
                            showButton = false;
                        }
                        html.push('<tr>');
                        html.push('<td>' + lab.toUpperCase() + '</td>');
                        html.push('<td>' + hasReranked + '</td>');
                        html.push('</tr>');
                    } 
                    html.push('</table>');
                    if(showButton){
                        html.push('<button id="resumeRound2">Resume Round 2</button><br/><br/>');
                        html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                        html.push('<input type="hidden" id="nextMode" value="Rerank2" />');   
                    }else{
                        html.push('<button id="refreshRound2">Refresh</button><br/><br/>');
                    }
                    displayResults(false,currentSemester,'2',html,res);  
                });
            }else{
                var html = [];
                displayResults(true,currentSemester,'2',html,res);
            }
        }
    });
};



exports.round3 = function(req,res){
    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        var preModes = ['SetSlots','Rank1','Round1','Rerank1','Rank2','Round2','Rerank2'];
        if(preModes.indexOf(currentMode) !== -1){
            res.write('<p>Please finish Round 2 first.</p>');
            return res.end();
        }else if(currentMode == 'Rank3'){
            labSettingModel.getCurrentModes(currentSemester,function(currentMode){

                var html = [];
                html.push('<table>');
                html.push('<tr><th>Lab</th><th>Has Checked?</th></tr>');
                var showButton = true;
                for(var lab in currentMode){
                    var hasRanked = '';
                    if(currentMode[lab] == 'Round3Ready'){
                        hasRanked = 'YES';
                    }else{
                        showButton = false;
                    }
                    html.push('<tr>');
                    html.push('<td>' + lab.toUpperCase() + '</td>');
                    html.push('<td>' + hasRanked + '</td>');
                    html.push('</tr>');
                } 
                html.push('</table>');
                if(showButton){
                    html.push('<br/><button id="startRound3">Start Round 3</button>');
                    html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                    html.push('<input type="hidden" id="nextMode" value="Round3" />');   
                }else{
                    html.push('<br/><button id="refreshRound3">Refresh</button>');
                }
                res.write(html.join('\n'));
                res.end();
            });
        }else{ // The rest of the modes
            // Show Round 3 results
            adminModel.getRoundDetails('3',function(details){
            labSettingModel.getAssignments(currentSemester,'3',function(assignments){
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

                    var totalAssigned = 0;
                    for(var lab in assignments){
                        var a = assignments[lab] || [];
                        totalAssigned += a.length;
                    }

                    var html = [];
                    if(totalAssigned > 0){
                        html.push('<button id="resetRound3">Reset Round 3</button>');
                        html.push('<label class="clickable yellow" id="viewDetails">View Details</label><br/><br/>')
                        html.push('<table>');
                        html.push('<tr><th colspan="4">Results</th></tr>');
                        html.push('<tr><th>Lab</th><th>Group</th><th>Members</th><th>Total</th></tr>');
                        var labCount = 0;
                        for(var lab in assignments){
                            var color = 'w';
                            if(labCount % 2 == 0){ color = 'b'; }
                            var numGroups = assignments[lab].length,
                                rowSpan = numGroups || 1,
                                totalStudents = 0;
                            assignments[lab].forEach(function(group){
                                totalStudents += groupCount[group]; 
                            });
                            html.push('<tr class="' + color + '">')
                            html.push('<td rowspan="' + rowSpan + '">' + lab.toUpperCase() + '</td>');
                            if(numGroups > 0){
                                html.push('<td>' + assignments[lab][0] + '</td>')
                                html.push('<td>' + names[assignments[lab][0]] + '</td>')
                            }else{
                                html.push('<td>&nbsp;</td>')
                                html.push('<td>&nbsp;</td>')
                            }
                            html.push('<td rowspan="' + rowSpan + '">' + totalStudents + '</td>');
                            html.push('</tr>');
                            for(var i = 1; i < numGroups; i++){
                                html.push('<tr class="' + color + '">')
                                html.push('<td>' + assignments[lab][i] + '</td>')
                                html.push('<td>' + names[assignments[lab][i]] + '</td>')
                                html.push('</tr>')
                            }
                            labCount++;
                        }
                        html.push('</table>');
                        html.push('<div style="display:none" id="roundDetails"><table>' + details + '</table></div>')
                    }else{
                        html.push('<p>No need for Round 3. All students were already assigned. </p>')
                    }
                    res.write(html.join('\n'));
                    res.end();
                });
            });
            });
        }
    });
};