var mongoose = require('mongoose');
var StudentGroup = mongoose.model('StudentGroup');

exports.labs = "acl csg cvmig ndsg s3 scl wsg".split(" ");
exports.USE_DB = true;

var processRanking = function(ranking){
    // From 1 2 3.. to acl csg cvmig..
    var newRanking = [];
    var labs = exports.labs;
    var labIndex = 0;
    ranking.map(function(x){
        return parseInt(x) - 1;
    }).forEach(function(i){
        newRanking[i] = labs[labIndex];
        labIndex++; 
    });
    return newRanking;
};

var reprocessRanking = function(ranking){
    // From acl csg cvmig.. to 1 2 3..
    var newRanking = [];
    var labs = exports.labs;
    var currentRank = 1;
    ranking.map(function(lab){
        var idx = labs.indexOf(lab);
        newRanking[idx] = currentRank.toString();
        currentRank++;
    })
    
    return newRanking;  
};


exports.getStudentGroups = function(semester,callback){
    StudentGroup.find({
        semester: semester
    }).sort({'number':1}).exec(function(err,studentGroups){
        studentGroups.forEach(function(group){
            //group.processedRanking = reprocessRanking(group.ranking).join('  ');
            group.processedRanking = reprocessRanking(group.ranking).join(',');
            //group.processedNames = group.names.join('/');
            group.processedNames = group.names.join(',');
        });
        callback(err,studentGroups);
    });
};

exports.update = function(data,callback){
    var query = {
        semester: data.currentSemester    
    };
    StudentGroup.remove(query,function(err){
        if(err){
            callback(err);
        }else{
            var studentGroups = data.content.trim().split('\n').filter(function(line){
                return line.trim() != '';  
            }).map(function(line){
                //var parts = line.trim().split(/\s+/);
                // Update: 05/05/15 -- request by Justine to make data comma-separated.
                var parts = line.trim().split(','); 
                return {
                    semester: data.currentSemester,
                    number: parts[0].trim(),
                    names: parts.slice(8).map(function(name){
                        return name.trim().toUpperCase();
                    }),
                    // names: parts[8].trim().split('/').map(function(name){
                    //     return name.trim().toLowerCase()
                    // }),
                    ranking: processRanking(parts.slice(1,8))
                }
            });
            StudentGroup.create(studentGroups,callback);
        }
    });
};

exports.getTotalStudents = function(semester,callback){
    StudentGroup.find({
        semester: semester
    }).exec(function(err,studentGroups){
        var totalStudents = 0;
        studentGroups.forEach(function(group){
            totalStudents += group.names.length;
        });
        callback(totalStudents);
    });
};

exports.getAllRankingsAndGroups = function(semester,callback){

    StudentGroup.find({
        semester: semester
    }).sort({'number':1}).exec(function(err,studentGroups){
        var allRankings = [],
            groupSizes = [],
            groupNames = [],
            groupNumbers = [];

        studentGroups.forEach(function(group){
            allRankings.push(reprocessRanking(group.ranking));
            groupSizes.push(group.names.length);
            //groupNames.push(group.names.join(' / '));
            groupNames.push(group.names.join('<br/>'));
            groupNumbers.push(group.number);
        });
        callback(err,allRankings,groupSizes,groupNames,groupNumbers);
    });  
};
