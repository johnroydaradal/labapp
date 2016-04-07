cache = {};
$(document).ready(function(){
    var $currentTab = null,

        $menuList = $('#menuList'),
        $title = $('h2'),
        $notice = $('#notice'),
        $contentDiv = $('#content div.other'),
        $timeline = $('#timeline'),
        $messages = $('#messages');

    var prefDetails = {};

    var setSemester = function(){
        $notice.html('').hide();
        var html = [],
            currentSemester = '';

        $.ajax({
            url: '/getCurrentSemester',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    currentSemester = xhr.responseText;
                }
                html.push('<p></p><label for="currentSemester">Current Semester:</label>');
                html.push('<input autofocous type="text" id="currentSemester" value="' + currentSemester + '"/>');
                html.push('<button id="setSemester">Save</button>');
                $contentDiv.html(html.join('\n')); 
            }
        })

        
    };

    var showStudentGroups = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/getStudentGroups',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    var html = [],
                        content = xhr.responseText;
                    html.push(content);
                    html.push('<button id="updateStudentGroups">Save</button>');
                    $contentDiv.html(html.join('\n')); 
                }
            } 
        });
        
    };

    var showLabSlots = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/getLabSlotsTable',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    $contentDiv.html(xhr.responseText); 
                }
            } 
        });
    };

    var showPreferenceTable = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/getPreferenceTable',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != "ERROR"){
                    // 
                    var data = JSON.parse(xhr.responseText);
                    if(data.status == 'Create'){
                        var html = [];
                        html.push('<p>Current Semester: ' + data.currentSemester + '</p>');
                        html.push('<button id="createPreferenceTable">Create Preference Table</button>');
                        html.push('<input type="hidden" id="currentSemester" value="' + data.currentSemester + '" />');
                        $contentDiv.html(html.join('\n')); 
                    }else if(data.status == 'Wait1'){
                        $contentDiv.html('<p>Please fill up lab slots first.</p>'); 
                    }else if(data.status == 'Wait2'){
                        $contentDiv.html('<p>Please wait for all lab heads to confirm their slots.</p>'); 
                    }else{
                        buildPreferenceTable(data);
                    }
                }
            } 
        });  
    };
    var doRound1 = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/round1',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    $contentDiv.html(xhr.responseText); 
                }
            } 
        });
    };
    var doRound2 = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/round2',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    $contentDiv.html(xhr.responseText); 
                }
            } 
        });
    };
    var doRound3 = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/round3',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    $contentDiv.html(xhr.responseText); 
                }
            } 
        }); 
    };

    var showResults = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/results',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    $contentDiv.html(xhr.responseText); 
                }
            } 
        });
    };

    var selectTab = function($tab){
        $currentTab = $tab;

        var tabText = $currentTab.text();

        $currentTab.addClass('selected');
        $title.html(tabText);
        $contentDiv.html('');
        $timeline.addClass('no_display');
        $notice.html('Loading..').show();
        switch(tabText){
            case 'SetSemester':
                setSemester();
                break;
            case 'StudentGroups':
                showStudentGroups();
                break;
            case 'LabSlots':
                showLabSlots();
                break;
            case 'PreferenceTable':
                showPreferenceTable();
                break;
            case 'Round1':
                doRound1();
                break;
            case 'Round2':
                doRound2();
                break;
            case 'Round3':
                doRound3();
                break;
            case 'Results':
                showResults();
                break;
        }
    };
    var tabChangeHandler = function(e){
        if(e.target.classList.contains('clickable')){
            if($currentTab) $currentTab.removeClass('selected');

            selectTab($(e.target));
        }
    };

    var buildPreferenceTable = function(data){
        var labs = data.labs,
            colorTable = data.colorTable,
            groupNames = data.groupNames,
            groupNumbers = data.groupNumbers,
            labRatings = data.labRatings,
            totalSlots = data.totalSlots,
            details = data.details,
            currentSemester = data.currentSemester;

        prefDetails = details;
            
        var html = [];
        html.push('<p>Current Semester: ' + currentSemester + '</p>');
        html.push('<ul id="detailsList" class="navigation yellow">')
        html.push('<li>View Details of:</li>')
        labs.forEach(function(lab){
            html.push('<li class="clickable">' + lab.toUpperCase() + '</li>')
        })
        html.push('</ul>')
        html.push('<table>');
        html.push('<tr><th rowspan="2">Group</th>');
        labs.forEach(function(lab){
            html.push('<th>' + lab.toUpperCase() + '</th>') 
        });
        html.push('<th rowspan="2">Members</th>');
        html.push('</tr><tr>');
        labs.forEach(function(lab){
            html.push('<th>' + totalSlots[lab] + '</th>') 
        });
        html.push('</tr>');
        for(var i=0; i < groupNumbers.length; i++){
            html.push('<tr>');
            html.push('<td>' + groupNumbers[i] + '</td>');
            labs.forEach(function(lab){
                var color = colorTable[lab][i];
                html.push('<td class="' + color + '">' + labRatings[lab][i] + '</td>');
                // html.push('<td class="' + color + '">' + color + '</td>');
            });
            html.push('<td>' + groupNames[i].toUpperCase() + '</td>');
            html.push('</tr>');
        }
        html.push('</table>');
        $contentDiv.html(html.join('\n'));
    };

    $(document.body).on('click','#setSemester',function(e){
        var currentSemester = $('#currentSemester').val(),
            data = {
                currentSemester: currentSemester
            };
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/updateCurrentSemester',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText == "OK"){
                    displayMessage("Successfully updated current semester.");
                }else{
                    displayMessage("Error: Cannot update at the moment. Please try again later.");
                }  
            }
        });
    });
    

    $(document.body).on('click','#updateStudentGroups',function(e) {
        var text = $('#studentGroups').val(),
            currentSemester = $('#currentSemester').val(),
            data = {
                content: text,
                currentSemester: currentSemester
            };
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/updateStudentGroups',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText == "OK"){
                    displayMessage("Successfully updated student groups.");
                }else{
                    displayMessage("Error: Cannot update at the moment. Please try again later.");
                }  
            }
        });
    });

    
    $(document.body).on('click','#resetRequiredLabSlots',function(e){
        var isSure = confirm('Are you sure you want to reset lab slots?');
        if(!isSure){ return; }
        var currentSemester =  $('#currentSemester').val();
        $.ajax({
            url: '/resetRequiredLabSlots/' + currentSemester,
            type: 'DELETE',
            success: function(data){
                if(data != "ERROR"){
                    displayMessage("Successfully reset required lab slots.");
                    $contentDiv.html(data);
                }else{
                    displayMessage("Error: Cannot reset at the moment. Please try again later.");
                }
            },
            error: function(){
                displayMessage("Error: Cannot reset at the moment. Please try again later.");
            }
        });
    });

    $(document.body).on('click','#updateRequiredLabSlots',function(e){
        var currentSemester =  $('#currentSemester').val(),
            data = {
                currentSemester: currentSemester,
                required: {
                    acl : parseInt($('#req_acl').val()) || 0,
                    csg : parseInt($('#req_csg').val()) || 0,
                    cvmig : parseInt($('#req_cvmig').val()) || 0,
                    ndsg : parseInt($('#req_ndsg').val()) || 0,
                    s3 : parseInt($('#req_s3').val()) || 0,
                    scl : parseInt($('#req_scl').val()) || 0,
                    wsg : parseInt($('#req_wsg').val()) || 0
                }
            };
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/updateRequiredLabSlots',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != "ERROR"){
                    displayMessage("Successfully updated lab slots.");
                    // $('#req_acl').val(data.required.acl);
                    // $('#req_csg').val(data.required.csg);
                    // $('#req_cvmig').val(data.required.cvmig);
                    // $('#req_ndsg').val(data.required.ndsg);
                    // $('#req_s3').val(data.required.s3);
                    // $('#req_scl').val(data.required.scl);
                    // $('#req_wsg').val(data.required.wsg);
                    $contentDiv.html(xhr.responseText);
                }else{
                    displayMessage("Error: Cannot update at the moment. Please try again later.");
                }  
            }
        });
    });
    

    $(document.body).on('click','#createPreferenceTable',function(e) {
        var data = {
                currentSemester: $('#currentSemester').val()
            };
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/createPreferenceTable',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != "ERROR"){
                    displayMessage("Successfully created preference table.");
                    // $contentDiv.html(xhr.responseText);
                    var data  = JSON.parse(xhr.responseText);
                    console.log(data);
                    buildPreferenceTable(data);
                }else{
                    displayMessage("Error: Cannot create preference table at the moment. Please try again later.");
                }  
            }
        });
    });

    $(document.body).on('click','#startRound1',function(e){
        var data = {
            nextMode : $('#nextMode').val(),
            currentSemester: $('#currentSemester').val()
        };
        displayMessage("Started Round 1.");
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/doRound1',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != "ERROR"){
                    if(xhr.responseText == "OK"){
                        displayMessage("Successfully executed Round 1.");
                        doRound1();
                    }else if(xhr.responseText == "RERANK"){
                        displayMessage("Some labs need to rerank for Round 1.");
                        doRound1();
                    }
                    // $contentDiv.html(xhr.responseText);
                    // var data  = JSON.parse(xhr.responseText);
                    // console.log(data);
                }else{
                    displayMessage("Error: Cannot start Round 1 at the moment. Please try again later.");
                }  
            }
        });
    });


    $(document.body).on('click','#startRound2',function(e){
        var data = {
            nextMode : $('#nextMode').val(),
            currentSemester: $('#currentSemester').val()
        };
        displayMessage("Started Round 2.");
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/doRound2',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != "ERROR"){
                    if(xhr.responseText == "OK"){
                        displayMessage("Successfully executed Round 2.");
                        doRound2();
                    }else if(xhr.responseText == "RERANK"){
                        displayMessage("Some labs need to rerank for Round 2.");
                        doRound2();
                    }
                    // $contentDiv.html(xhr.responseText);
                    // var data  = JSON.parse(xhr.responseText);
                    // console.log(data);
                }else{
                    displayMessage("Error: Cannot start Round 2 at the moment. Please try again later.");
                }  
            }
        });
    });


    $(document.body).on('click','#startRound3',function(e){
        var data = {
            nextMode : $('#nextMode').val(),
            currentSemester: $('#currentSemester').val()
        };
        displayMessage("Started Round 3.");
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/doRound3',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != "ERROR"){
                    if(xhr.responseText == "OK"){
                        displayMessage("Successfully executed Round 3.");
                        doRound3();
                    }
                    // $contentDiv.html(xhr.responseText);
                    // var data  = JSON.parse(xhr.responseText);
                    // console.log(data);
                }else{
                    displayMessage("Error: Cannot start Round 3 at the moment. Please try again later.");
                }  
            }
        });
    });

    $(document.body).on('click','#refreshRound1',function(e){
        doRound1();
    });

    $(document.body).on('click','#refreshRound2',function(e){
        doRound2();
    });

    $(document.body).on('click','#refreshRound3',function(e){
        doRound3();
    });


    $(document.body).on('click','#refreshLabSlots',function(e){
        showLabSlots();
    });


    $(document.body).on('click','#resumeRound1',function(e){
        var data = {
            nextMode : $('#nextMode').val(), // Rerank1
            currentSemester: $('#currentSemester').val()
        };
        displayMessage("Resuming Round 1.");
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/resumeRound1',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != "ERROR"){
                    if(xhr.responseText == "OK"){
                        displayMessage("Successfully executed Round 1.");
                    }else if(xhr.responseText == "RERANK"){
                        displayMessage("Some labs need to rerank for Round 1.");
                    }
                    doRound1();
                }else{
                    displayMessage("Error: Cannot resume Round 1 at the moment. Please try again later.");
                }  
            }
        });
    });


    $(document.body).on('click','#resumeRound2',function(e){
        var data = {
            nextMode : $('#nextMode').val(), // Rerank2
            currentSemester: $('#currentSemester').val()
        };
        displayMessage("Resuming Round 2.");
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/resumeRound2',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != "ERROR"){
                    if(xhr.responseText == "OK"){
                        displayMessage("Successfully executed Round 2.");
                    }else if(xhr.responseText == "RERANK"){
                        displayMessage("Some labs need to rerank for Round 2.");
                    }
                    doRound2();
                }else{
                    displayMessage("Error: Cannot resume Round 2 at the moment. Please try again later.");
                }  
            }
        });
    });

    $(document.body).on('click','#resultsToggle',function(e){
        if($('#resultsToggle').html() == 'Show Results'){
            $('#resultsToggle').html('Hide Results');
            $('#resultsDiv').removeClass('hidden');
        } else{
            $('#resultsToggle').html('Show Results');
            $('#resultsDiv').addClass('hidden');
        }
    });

    $(document.body).on('click','.updateButton',function(e){
        var $btn = $(e.target),
            cells = $btn.parent().parent().children();

        var lab = cells[0].innerHTML,
            additional = parseInt($(cells[2]).children()[0].value) || 0;

        var data = {
            lab : lab, 
            additional: additional,
            currentSemester: $('#currentSemester').val()
        };
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/updateAdditional',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText == "OK"){
                    displayMessage("Successfully updated additional slots of " + lab + " to " + additional + ".");
                    showLabSlots();
                }else{
                    displayMessage("Error: Cannot update additional slots at the moment. Please try again later.");
                }  
            }
        });
            
    });

    $(document.body).on('click','#detailsList',function(e){
        if(e.target.classList.contains('clickable')){
            var lab = e.target.innerHTML.toLowerCase();
            displayModal(prefDetails[lab]);
        }
    });

    var resetRound = function(roundNum){
        displayMessage("Resetting Round " + roundNum + ".");
        $.ajax({
            url: '/resetRound' + roundNum,
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText == "OK"){
                    displayMessage("Successfully reset Round " + roundNum + ".");
                    if(roundNum == '1'){
                        doRound1();
                    }else if(roundNum == '2'){
                        doRound2();
                    }else{
                        doRound3();
                    }
                }else{
                    displayMessage("Error: Cannot reset Round " + roundNum + " at the moment. Please try again later.");
                }  
            }
        });
    };

    $(document.body).on('click','#resetRound1',function(e){
        var isSure = confirm('Are you sure you want to reset Round 1?');
        if(!isSure){ return; }
        resetRound('1');
    });
    $(document.body).on('click','#resetRound2',function(e){
        var isSure = confirm('Are you sure you want to reset Round 2?');
        if(!isSure){ return; }
        resetRound('2');
    });
    $(document.body).on('click','#resetRound3',function(e){
        var isSure = confirm('Are you sure you want to reset Round 3?');
        if(!isSure){ return; }
        resetRound('3');
    });


    $(document.body).on('click','#viewDetails',function(e){
        displayModal($('#roundDetails').html());
    })
    
    $notice.html('Please select task.');
    $menuList.click(tabChangeHandler);
});