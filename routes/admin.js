var studentGroupModel = require('../model/studentGroup'),
    adminModel = require('../model/admin'),
    labSettingModel = require('../model/labSetting');


if(!studentGroupModel.USE_DB){
    var labSettingModel = require('../testModel/labSetting');
}


exports.viewLogin = function(req,res){
    res.render('adminLogin',{
        title: 'Login - Admin',
        messages: req.flash('info')
    });
};

exports.home = function(req,res){
    res.render('adminHome',{
        title: 'Home - Admin',
        messages: req.flash('info')
    });  
};

exports.root = function(req,res){
    if(req.session.adminId){
        exports.home(req,res); 
    }else{
        exports.viewLogin(req,res); 
    }   
};

exports.login = function(req,res){
    adminModel.authenticate(req.body.password,function(isOk,admin){
        if(isOk){
            req.session.adminId = admin.id.toString();
            req.session.currentSemester = admin.currentSemester;
        }else{
            req.flash('info','Wrong password.');
        }
        res.redirect('/admin');
    });
};

exports.logout = function(req,res){
    if(req.session.adminId){
        delete req.session.adminId;
        req.flash('info','Successfully logged out.');
    }
    res.redirect('/admin');
};

exports.settings = function(req,res){
    res.render('adminSettings',{
        title: 'Settings - Admin',
        messages: req.flash('info')
    });  
};


exports.changePassword = function(req,res){
    adminModel.authenticate(req.body.oldPassword,function(isOk,admin){
        if(isOk){
            adminModel.updatePassword(req.body.newPassword,function(err){
                if(err){
                    req.flash('info',"Error: Couldn't update password this time.");
                }else{
                    req.flash('info','Successfully changed password.');
                }
                res.redirect('/settingsAdmin');
            });
        }else{
            req.flash('info',"Error: Incorrect password.");
            res.redirect('/settingsAdmin');
        }
    });
};


exports.getStudentGroups = function(req,res){
    var html = [];
    adminModel.getCurrentSemester(function(currentSemester){
        studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
            if(!err){
                html.push('<p>Current Semester: ' + currentSemester + '</p>'); 
                // html.push('<p>Expected Format: groupNum acl csg cvmig ndsg s3 scl wsg students (separated by spaces)</p>'); 
                html.push('<p>Expected Format: groupNum,acl,csg,cvmig,ndsg,s3,scl,wsg,studentName1 studentNumber1  (separated by comma)</p>'); 
                
                var content = [];
                studentGroups.forEach(function(group){
                    var parts = [group.number,group.processedRanking,group.processedNames];
                    //content.push(parts.join('  ')); 
                    content.push(parts.join(','));
                });
                content = content.join('\n');
                html.push('<textarea rows="10" cols="60" id="studentGroups">' + content + '</textarea><br/><br/>');
                html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                res.write(html.join('\n'));
                return res.end();
            }else{
                res.writeHead(500,'ERROR');
                return res.send('ERROR')
            }
        });
    });    
};


exports.updateStudentGroups = function(req,res){
    studentGroupModel.update(req.body,function(err){
        if(err){
            console.log(err);
            return res.send("ER");
        }else{
            console.log("Successfully updated student groups.");
            return res.send("OK");
        }
    });
};

exports.getCurrentSemester = function(req,res){
    adminModel.getCurrentSemester(function(currentSemester){
        return res.send(currentSemester);
    });
};

exports.updateCurrentSemester = function(req,res){
    adminModel.updateSemester(req.body.currentSemester,function(err){
        if(err){
            console.log(err);
            return res.send("ER");
        }else{
            console.log("Successfully updated current semester.");
            return res.send("OK");
        }
    });
};

exports.getLabSlotsTable = function(req,res){
    var html = [];
    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        studentGroupModel.getTotalStudents(currentSemester,function(totalStudents){
            labSettingModel.getLabSettings(currentSemester,function(err,labSettings){
                if(!err){
                    html.push('<p>Current Semester: ' + currentSemester + '</p>');
                    html.push('<table>');
                    html.push('<tr><th>Lab</th><th>Required</th><th>Additional</th><th>Total</th><th></th></tr>');
                    var totalSlots = 0;
                    if (labSettings.length > 0){
                        labSettings.forEach(function(labSetting){
                            var total = labSetting.required + (labSetting.additional || 0),
                                additional = labSetting.additional;
                            if(additional === undefined){ additional = ''; }
                            html.push('<tr>');
                            html.push('<td>' + labSetting.lab + '</td>');
                            html.push('<td id="req_' + labSetting.lab + '">' + labSetting.required + '</td>');
                            if(currentMode == 'SetSlots'){
                                html.push('<td><input type="text" id="add_' + labSetting.lab + '" value="' + additional + '" /></td>');
                            }else{
                                html.push('<td id="add_' + labSetting.lab + '">' + additional + '</td>');
                            }
                            html.push('<td id="total_' + labSetting.lab + '">' + total + '</td>');
                            if(currentMode == 'SetSlots'){
                                html.push('<td><button class="updateButton">Update</button></td>')   
                            }else{
                                html.push('<td></td>');
                            }
                            html.push('</tr>');
                            totalSlots += total;
                        });   
                        html.push('<tr><th colspan="4">Total Slots</th><th>' + totalSlots + '</th></tr>');
                        html.push('<tr><th colspan="4">Total Students</th><th>' + totalStudents + '</th></tr>');
                        html.push('</table>');
                        html.push('<br/><button id="resetRequiredLabSlots">Reset</button>');
                        html.push('<button id="refreshLabSlots">Refresh</button>');
                    }else{
                        studentGroupModel.labs.forEach(function(lab){
                            html.push('<tr>');
                            html.push('<td>' + lab + '</td>');
                            html.push('<td><input type="text" id="req_' + lab + '" value="" /></td>');
                            html.push('<td id="add_' + lab + '"></td>');
                            html.push('<td id="total_' + lab + '"></td>');
                            html.push('<td></td>');
                            html.push('</tr>');
                        });

                        html.push('<tr><th colspan="4">Total Slots</th><th>' + totalSlots + '</th></tr>');
                        html.push('<tr><th colspan="4">Total Students</th><th>' + totalStudents + '</th></tr>');
                        html.push('</table>');
                        html.push('<br/><button id="updateRequiredLabSlots">Save</button>');
                    }
                    
                    html.push('<input type="hidden" id="currentSemester" value="' + currentSemester + '" />');
                    res.write(html.join('\n'));
                    return res.end();
                }else{
                    res.writeHead(500,'ERROR');
                    return res.send('ERROR')
                }
            });  
        });
        
    });
};

exports.updateRequiredLabSlots = function(req,res){
    labSettingModel.updateRequired(req.body,function(err){
        if(err){
            console.log(err);
            return res.send("ERROR");
        }else{
            console.log("Successfully updated required slots.");
            exports.getLabSlotsTable(req,res);
        }
    });
};

exports.resetRequiredLabSlots = function(req,res){
    labSettingModel.resetRequired(req.params.semester,function(err){
        adminModel.updateCurrentMode('SetSlots',function(err){
            if(err){
                console.log(err);
                return res.send("ER");
            }else{
                console.log("Successfully reset required slots.");
                exports.getLabSlotsTable(req,res);
            }
        })
    })
};


exports.updateAdditionalLabSlots = function(req,res){
    var data = {
        semester: req.body.currentSemester,
        lab: req.body.lab,
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

exports.getPreferenceTable = function(req,res){
    var labs = studentGroupModel.labs;
    var numLabs = labs.length;
    adminModel.getCurrentSettings(function(currentSemester,currentMode){
        if(currentMode == 'SetSlots'){
            labSettingModel.getLabSettings(currentSemester,function(err,labSettings){
                var countConfirmed = 0;
                labSettings.forEach(function(labSetting){
                    if(labSetting.additional !== undefined){
                        countConfirmed += 1;
                    }
                });
                if(countConfirmed == numLabs){
                    var data = {
                        currentSemester: currentSemester,
                        status: 'Create'
                    };
                }else if(labSettings.length == 0){
                    var data = {
                        status: 'Wait1'
                    }   
                }else{
                    var data = {
                        status: 'Wait2'
                    }
                }
                res.writeHead(200,{'Content-Type':'application/json'});
                res.write(JSON.stringify(data));  
                res.end();
            });
        }else{
            studentGroupModel.getAllRankingsAndGroups(currentSemester,function(err,allRankings,groupSizes,groupNames,groupNumbers){
                if(err){
                    console.log(err);
                    return res.send("ERROR");
                }
                var labRatings = {},
                    labIndex = 0;

                labs.forEach(function(lab){
                    labRatings[lab] = allRankings.map(function(ranking){
                        return ranking[labIndex];
                    });
                    labIndex++;
                });
                labSettingModel.getColorTable(currentSemester,function(err,colorTable,details){
                    if(err){
                        console.log(err);
                        return res.send("ERROR");
                    }
                    labSettingModel.getTotalSlots(currentSemester,function(err,totalSlots){
                        if(err){
                            console.log(err);
                            return res.send("ERROR");
                        }
                        var data = {
                            currentSemester: currentSemester,
                            status: 'Done',
                            labs: labs,
                            groupNames: groupNames,
                            groupNumbers: groupNumbers,
                            labRatings: labRatings,
                            colorTable: colorTable,
                            totalSlots: totalSlots,
                            details: details
                        };
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.write(JSON.stringify(data));  
                        res.end();
                    });
                })
            });
            
        }
    });
};

exports.createPreferenceTable = function(req,res){
    var semester = req.body.currentSemester;
    var labs = studentGroupModel.labs,
        labRatings = {},
        targetTotal = {},
        colorTable = {},
        totalColored = {},
        log = {},
        details = {};
    labSettingModel.getTotalSlots(semester,function(err,totalSlots){
        studentGroupModel.getAllRankingsAndGroups(semester,function(err,allRankings,groupSizes,groupNames,groupNumbers){
            var labIndex = 0;
            labs.forEach(function(lab){
                // console.log('--------')
                log[lab] = [];
                colorTable[lab] = [];
                totalColored[lab] = 0;
                targetTotal[lab] = Math.ceil(1.5 * totalSlots[lab]);
                labRatings[lab] = allRankings.map(function(ranking){
                    return ranking[labIndex];
                }); 
                var colors = {'g':[],'y':[]},
                    totalColors = {'g':0,'y':0};
                log[lab].push('<table>')
                log[lab].push('<tr><th colspan="3">'+lab.toUpperCase()+'</th></tr>')
                log[lab].push('<tr><th colspan="3">Target Total: 150% of ' + totalSlots[lab] + ' = ' + targetTotal[lab]+'</th></tr>');
                log[lab].push('<tr><th>Group</th><th>Ranking</th><th>Members</th>')
                for(var i=0; i < allRankings.length; i++){
                    var groupSize  = groupSizes[i];
                    if(labRatings[lab][i] == "1"){
                        colorTable[lab][i] = 'g';   
                        totalColored[lab] += groupSize;
                        totalColors['g'] += groupSize;
                        colors['g'].push([labRatings[lab][i],groupNames[i],groupNumbers[i]])
                    }else if(labRatings[lab][i] == "2" || labRatings[lab][i] == "3"){
                        colorTable[lab][i] = 'y';   
                        totalColored[lab] += groupSize;
                        totalColors['y'] += groupSize;
                        colors['y'].push([labRatings[lab][i],groupNames[i],groupNumbers[i]])
                    }else{
                        colorTable[lab][i] = 'w';   
                    }
                }
                ['green','yellow'].forEach(function(color){
                    var key = color[0];
                    log[lab].push('<tr><th colspan="3">Colored ' + color + ': ' + totalColors[key]+'</th></tr>')
                    colors[key].forEach(function(data){
                        var rating = data[0],
                            names = data[1],
                            groupNum = data[2];
                        log[lab].push('<tr>')
                        log[lab].push('<td class="' + key + '">' + groupNum + '</td>')
                        log[lab].push('<td class="' + key + '">' + rating + '</td>')
                        log[lab].push('<td class="' + key + '">' + names.toUpperCase() + '</td>')
                        log[lab].push('</tr>')
                    })
                });
                log[lab].push('<tr><th colspan="3">Total Colored Students: ' + totalColored[lab]+'</th></tr>')
                log[lab].push('<tr><th colspan="3">Need to Color: ' + Math.max(targetTotal[lab] - totalColored[lab],0)+'</th></tr>')
                
                if(targetTotal[lab] > totalColored[lab]){
                    log[lab].push('<tr><th colspan="3">Coloring other ranks until target is reached..</th></tr>')
                    var otherRatings = ['4','5','6','7'];
                    for(var j=0;j<otherRatings.length;j++){
                        var total = 0,
                            colored = [];
                        var otherRating = otherRatings[j];
                        for(var i=0; i < allRankings.length;i++){
                            if(labRatings[lab][i] == otherRating){
                                colorTable[lab][i] = 'y';
                                totalColored[lab] += groupSizes[i];
                                total += groupSizes[i];
                                colored.push([labRatings[lab][i],groupNames[i],groupNumbers[i]])
                            }
                        }
                        log[lab].push('<tr><th colspan="3">Colored with rank ' + otherRating + ': ' + total +'</th></tr>')
                        colored.forEach(function(data){
                            var rating = data[0],
                                names = data[1],
                                groupNum = data[2];
                            log[lab].push('<tr>')
                            log[lab].push('<td class="y">' + groupNum + '</td>')
                            log[lab].push('<td class="y">' + rating + '</td>')
                            log[lab].push('<td class="y">' + names.toUpperCase() + '</td>')
                            log[lab].push('</tr>')
                        })
                        log[lab].push('<tr><th colspan="3">Total Colored Students: ' + totalColored[lab]  +'</th></tr>')
                        log[lab].push('<tr><th colspan="3">Need to Color: ' + Math.max(targetTotal[lab] - totalColored[lab],0) +'</th></tr>')
                        if(totalColored[lab] >= targetTotal[lab]){
                            log[lab].push('<tr><th colspan="3">End for ' + lab.toUpperCase() +'</th></tr>')
                            break;
                        }
                    }   
                }else{
                    log[lab].push('<tr><th colspan="3">End for ' + lab.toUpperCase() +'</th></tr>')
                }
                log[lab].push('</table>')
                details[lab] = log[lab].join('\n');
                labIndex++;
            });
            labSettingModel.saveColorTable(semester,colorTable,details,function(err){
                if(err){
                    console.log(err);
                    return res.send("ERROR");
                }
                adminModel.updateCurrentMode('Rank1',function(err){
                    if(err){
                        console.log(err);
                        return res.send("ERROR");
                    }
                    var data = {
                        currentSemester: semester,
                        colorTable: colorTable,
                        labs: labs,
                        groupNames: groupNames,
                        groupNumbers: groupNumbers,
                        labRatings: labRatings,
                        totalSlots: totalSlots,
                        details: details
                    };
                    res.writeHead(200,{'Content-Type':'application/json'});
                    res.write(JSON.stringify(data));  
                    res.end();
                }) 
            });

            
        });
    });

};


exports.getResults = function(req,res){
    adminModel.getCurrentSemester(function(currentSemester){
        labSettingModel.getResults(currentSemester,function(assignments){
            studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
                if(err){
                    console.log(err);
                    return res.send("ERROR");
                }
                var names = {},
                    whereAssigned = {};
                studentGroups.forEach(function(group){
                    //names[group.number] =  group.names.join(' / ').toUpperCase();
                    names[group.number] =  group.names.join(' <br/> ').toUpperCase();
                    whereAssigned[group.number] = null;
                });
                var html = [];
                html.push('<table>');
                html.push('<tr><th colspan="3">Results (<a class="rerank" href="/printResults" target="_blank">Print</a>)</th></tr>');
                html.push('<tr><th>Group</th><th>Members</th><th>Lab</th></tr>');
                for(var lab in assignments){
                    for(var round in assignments[lab]){
                        assignments[lab][round].forEach(function(group){
                            whereAssigned[group] = round + ':' + lab.toUpperCase();
                        });   
                    }
                }
                studentGroups.forEach(function(sg){
                    var group = sg.number;
                    var whichLab = whereAssigned[group] || '';
                    html.push('<tr>')
                    html.push('<td>' + group + '</td>')
                    html.push('<td>' + names[group] + '</td>')
                    html.push('<td>' + whichLab + '</td>')
                    html.push('</tr>');
                })
                if(studentGroups.length == 0){
                    html.push('<tr><td colspan="3">No student groups yet.</td></tr>');
                }

                html.push('</table>');
                res.write(html.join('\n'));
                res.end();
            });
        });
    });
};

exports.printResults = function(req,res){
    adminModel.getCurrentSemester(function(currentSemester){
        labSettingModel.getResults(currentSemester,function(assignments){
            studentGroupModel.getStudentGroups(currentSemester,function(err,studentGroups){
                var names = {},
                    whereAssigned = {};
                studentGroups.forEach(function(group){
                    //names[group.number] =  group.names.join(' / ').toUpperCase();
                    names[group.number] =  group.names.join(' <br/> ').toUpperCase();
                    whereAssigned[group.number] = null;
                });
                var html = [];
                html.push('<table>');
                html.push('<tr><th colspan="3">Lab Assignment Results (' + currentSemester + ')</th></tr>');
                html.push('<tr><th>Group</th><th>Members</th><th>Lab</th></tr>');
                for(var lab in assignments){
                    for(var round in assignments[lab]){
                        assignments[lab][round].forEach(function(group){
                            whereAssigned[group] = lab.toUpperCase();
                        });   
                    }
                }
                studentGroups.forEach(function(sg){
                    var group = sg.number;
                    var whichLab = whereAssigned[group] || '';
                    html.push('<tr>')
                    html.push('<td>' + group + '</td>')
                    html.push('<td>' + names[group] + '</td>')
                    html.push('<td>' + whichLab + '</td>')
                    html.push('</tr>');
                })
                if(studentGroups.length == 0){
                    html.push('<tr><td colspan="3">No student groups yet.</td></tr>');
                }


                html.push('</table>');
                var body = html.join('\n');
                res.render('printResults',{
                    body: body
                });
            });
        });
    });
};