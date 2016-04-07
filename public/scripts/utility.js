var displayMessage = function(message,erase){
    erase = erase || true;
    $('#messages').html('<p>'+message+'</p>');
    $('#messages p').fadeIn('fast',function(){
        if(erase){
            var that = this;
            setTimeout(function(){
                $(that).fadeOut('fast');
            },2500);
        }
    });  
};

var eraseMessage = function(){
    $('#messages').html('<p>&nbsp;</p>');
};

var updateSubjectList = function(){
    var subjects = localStorage.getItem('subjects').split(','),
        list = [];
    subjects.forEach(function(subject){
        var location = subject,
            urlParts = window.location.pathname.split('/');
        if(urlParts[2]) location += '/' + urlParts[2];
        list.push('<li><a href="/' + location + '">' + subject +'</a></li>');
    });
    $('#footer .navigation').html(list.join('\n'));
};


var breakStudentString = function(studentString){
    var parts = studentString.split(",");
    return {
        lastName : parts[0].trim(),
        firstName : parts[1].trim(),
        studentNumber : parts[2].trim()
    };
};
var createStudentTag = function(studentData){
    var student;
    if(typeof studentData == "string"){
        student = breakStudentString(studentData);
    }else{
        student = studentData;
    }
    var divClass = student.status !== 0 ? "student_tag" : "student_tag dropped";
    var tag = ['<div class="'+divClass+'">'];
    tag.push('<label class="student_name">'+student.lastName + ', ' + student.firstName+'</label>');
    tag.push('<label class="student_number">'+student.studentNumber+'</label>');
    tag.push('</div>');
    return tag.join('\n');
};

var displayModal = function(html){
    var $modal = $('#modal');
    if($modal.length == 0){
        $modal = $('<div id="modal"></div>');
        $('body').append($modal);
    }
    $modal.html(html);
    $modal.append('<label class="close clickable">Close</label>');
    $modal.show();
    $('#modal label.close').click(function(){
        $modal.hide(); 
    });
};

var closeModal = function(){
    $('#modal label.close').click();  
};

var makeDate = function(dateString){
    // format : YYYY-MM-DD
    var dateParts = dateString.split("-"),
        year = +dateParts[0],
        month = +dateParts[1],
        date = +dateParts[2];
    return new Date(year,month-1,date);
};

var getSubjectDaysInMonth = function(subjectDays,month,year,regular_only){
    regular_only = regular_only || false;

    var days = 'S M T W Th F S'.split(' '),
        month = month - 1,
        subjectDaysIndex = subjectDays.map(function(x){
            return days.indexOf(x); 
        }),
        today = new Date(year,month,1),
        daysInMonth = [];
    while(true){
        if(subjectDaysIndex.indexOf(today.getDay()) !== -1){
            daysInMonth.push({
                day : today,
                status: 'regular'
            });
        }else if(!regular_only){
            daysInMonth.push({
                day : today,
                status: 'irregular'
            });
        }
        var prevMonth = today.getMonth();
        //move to next day
        today = new Date(year,month,today.getDate()+1);
        if(today.getMonth() != prevMonth){
            return daysInMonth;
        }
    }
};

var makeAttachmentFullPath = function(attachment){
    var doctype = docTypes[attachment.fileType].toLowerCase();
    //return ['','download',currentSubjectCode,doctype,attachment.filePath].join('/'); 
    
    if(doctype == 'tool' && attachment.filePath.startsWith('http://')){
        return attachment.filePath;
    }else{      
        return ['','attachment',attachment.fileId,currentSubjectCode,doctype,attachment.filePath].join('/');  
    }
        
};


var exports = exports;
if(this.exports || exports){
    exports.createStudentTag = createStudentTag;
}

Array.prototype.remove = function(item){  
    var index = this.indexOf(item);
    if(index !== -1){
        this.splice(index,1);  
    }  
};  

Array.prototype.has = function(item){
    return this.indexOf(item) !== -1;  
};

Array.prototype.addToSet = function(item){  
    if(this.indexOf(item) === -1){
        this.push(item);  
    }  
}; 

String.prototype.startsWith = function(str){
    return this.indexOf(str) == 0;
};