$(document).ready(function(){
    var $newPwd = $('#newPassword'),
        $renewPwd = $('#reNewPassword');

    var displayMessage = function(message,erase){
        $('#messages').html('<p>'+message+'</p>');
        $('#messages p').fadeIn('fast',function(){
            // if(erase){
            //     var that = this;
            //     setTimeout(function(){
            //         $(that).fadeOut('fast');
            //     },2500);
            // }
        });  
    };

    $('form').submit(function(e){
        if($newPwd.val() !== $renewPwd.val()){
            e.preventDefault();
            displayMessage("New passwords don't match.");
        }
    }) 
});