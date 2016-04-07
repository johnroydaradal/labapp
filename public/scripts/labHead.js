cache = {};
// Something
console.log("hello")
$(document).ready(function(){
    var $currentTab = null,

        $menuList = $('#menuList'),
        $title = $('h2'),
        $notice = $('#notice'),
        $contentDiv = $('#content div.other'),
        $timeline = $('#timeline'),
        $messages = $('#messages');

    
    var setCapacity = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/getLabHeadSlotsTable',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    $contentDiv.html(xhr.responseText); 
                }
            } 
        });
    };

    var doRound1 = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/getRound1',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    $contentDiv.html(xhr.responseText); 

                }
            } 
        });
    };

    var rerank1 = function(){
        $.ajax({
            url: '/getRerank1',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    displayModal(xhr.responseText); 
                }
            }
        })    
    };

    var doRound2 = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/getRound2',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    $contentDiv.html(xhr.responseText); 

                }
            } 
        }); 
    };

    var rerank2 = function(){
        $.ajax({
            url: '/getRerank2',
            type: 'GET',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText != ""){
                    displayModal(xhr.responseText); 
                }
            }
        })    
    };

    var doRound3 = function(){
        $notice.html('').hide();
        $.ajax({
            url: '/getRound3',
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
            url: '/getResults',
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
            case 'Capacity':
                setCapacity();
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

    $(document.body).on('click','#updateAdditionalLabSlots',function(e){
        var currentSemester =  $('#currentSemester').val(),
            data = {
                currentSemester: currentSemester,
                additional: parseInt($('#additional').val()) || 0
            };
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/updateAdditionalLabSlots',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText == "OK"){
                    displayMessage("Successfully updated lab slots.");
                }else{
                    displayMessage("Error: Cannot update at the moment. Please try again later.");
                }  
            }
        });
    });
    $(document.body).on('click','#saveRanking',function(e){
        var currentSemester =  $('#currentSemester').val(),
            currentRound = $('#currentRound').val(),
            nextMode = $('#nextMode').val(),
            boxes = $('input:text'),
            rankings = {};

        boxes.each(function(i,box){
            var $box = $(box),
                rank = $box.val().trim();
            if(rank.match(/^[0-9]+$/)){
                rank = parseInt(rank);
                rankings[rank] = $box.attr('id').split("_")[1];
            }
        });
        var finalRanking = [];
        var keys = Object.keys(rankings).sort(function(a, b){return a-b});
        keys.forEach(function(rank){
            finalRanking.push(rankings[rank]);
        })
        console.log(keys);
        console.log(finalRanking);

        var data = {
            currentSemester: currentSemester,
            nextMode: nextMode,
            currentRound: currentRound,
            ranking: finalRanking
        };
        closeModal();
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/submitRankings',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText == "OK"){
                    displayMessage("Successfully updated rankings.");
                    if(currentRound == 'Round1'){
                        doRound1();
                    }else if(currentRound == 'Round2'){
                        doRound2();
                    }
                }else{
                    displayMessage("Error: Cannot update at the moment. Please try again later.");
                }  
            }
        });
    });
    

    $(document.body).on('click','#saveExtra',function(e){
        var currentSemester =  $('#currentSemester').val(),
            currentRound = $('#currentRound').val(),
            nextMode = $('#nextMode').val(),
            boxes = $('input:checkbox:checked'),
            extra = [];

        boxes.each(function(i,box){
            var $box = $(box);
            extra.push($box.attr('id').split("_")[1]);
        });

        var data = {
            currentSemester: currentSemester,
            nextMode: nextMode,
            extra: extra
        };
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: '/submitExtra',
            type: 'POST',
            complete: function(xhr){
                if(xhr.status == 200 && xhr.responseText == "OK"){
                    displayMessage("Successfully saved.");
                    doRound3();
                }else{
                    displayMessage("Error: Cannot update at the moment. Please try again later.");
                }  
            }
        });
    });

    $(document.body).on('change','td input:text',function(e){
        var boxes = $('input:text'),
            total = 0;
        boxes.each(function(i,box){
            var $box = $(box);
            if($box.val().trim().match(/^[0-9]+$/)){
                var numMembers = parseInt($box.next().val()),
                    multiplier = parseFloat($box.next().next().val());
                console.log(numMembers);
                console.log(multiplier);
                total += numMembers * multiplier;
            } 

        });
        $('#rankTotal').text(total);
        var rankLimit = parseInt($('#rankLimit').html());
        // if (total >= rankLimit){
        //     $('#saveRanking').removeClass('hidden');
        // }else{
        //     $('#saveRanking').addClass('hidden');
        // }
    });

    $(document.body).on('click','#refreshCapacity',function(e){
        setCapacity();
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

    $(document.body).on('click','#rerank1',function(e){
        rerank1();
    });

    $(document.body).on('click','#rerank2',function(e){
        rerank2();
    });


    $notice.html('Please select task.');
    $menuList.click(tabChangeHandler);
});