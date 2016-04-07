var express = require('express')
  , engine = require('ejs-locals')
  , flash = require('connect-flash')
  , db = require('./model/db')
  , admin = require('./routes/admin')
  , labHead = require('./routes/labHead')
  , getRound = require('./routes/getRound')
  , doRound = require('./routes/doRound')
  , resetRound = require('./routes/resetRound')
  , rerank = require('./routes/rerank')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.engine('ejs',engine);

  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('Secret Cookie Code'));
  app.use(express.session({cookie: {maxAge: 1 * 60 * 60 * 1000}})); // 1 hour
  app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
  });
  app.use(flash());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var checkAdminAuth = function(req,res,next){
    if(!req.session.adminId){
      req.flash('info','Not allowed!');
      res.redirect('/');
    }
    next();
};
var checkLabHeadAuth = function(req,res,next){
    if(!req.session.labHeadId){
      req.flash('info','Not logged in!');
      res.redirect('/');
    }
    next();
};

Array.prototype.remove = function(item){  
    var index = this.indexOf(item);
    if(index !== -1){
        this.splice(index,1);  
    }  
};
  
Array.prototype.addToSet = function(item){  
    if(this.indexOf(item) === -1){
        this.push(item);  
    }  
};

app.get('/', labHead.root);
app.get('/admin', admin.root);
app.post('/authenticateLabHead',labHead.login);
app.post('/authenticateAdmin',admin.login);
app.get('/logoutLabHead',labHead.logout);
app.get('/logoutAdmin',admin.logout);

app.get('/settingsAdmin',checkAdminAuth,admin.settings);
app.post('/changeAdminPassword',checkAdminAuth,admin.changePassword);
app.get('/settingsLabHead',checkLabHeadAuth,labHead.settings);
app.post('/changeLabHeadPassword',checkLabHeadAuth,labHead.changePassword);

app.get('/getCurrentSemester',checkAdminAuth,admin.getCurrentSemester);
app.post('/updateCurrentSemester',checkAdminAuth,admin.updateCurrentSemester);
app.get('/getStudentGroups',checkAdminAuth,admin.getStudentGroups);
app.post('/updateStudentGroups',checkAdminAuth,admin.updateStudentGroups);
app.get('/getLabSlotsTable',checkAdminAuth,admin.getLabSlotsTable);
app.post('/updateRequiredLabSlots',checkAdminAuth,admin.updateRequiredLabSlots);
app.delete('/resetRequiredLabSlots/:semester',checkAdminAuth,admin.resetRequiredLabSlots);
app.post('/updateAdditional',checkAdminAuth,admin.updateAdditionalLabSlots);

app.get('/getLabHeadSlotsTable',checkLabHeadAuth,labHead.getLabSlotsTable);
app.post('/updateAdditionalLabSlots',checkLabHeadAuth,labHead.updateAdditionalLabSlots);

app.get('/getPreferenceTable',checkAdminAuth,admin.getPreferenceTable);
app.post('/createPreferenceTable',checkAdminAuth,admin.createPreferenceTable);


app.post('/submitRankings',checkLabHeadAuth,labHead.submitRankings);
app.post('/submitExtra',checkLabHeadAuth,labHead.submitExtra);
app.get('/getRound1',checkLabHeadAuth,labHead.getRound1);
app.get('/getRound2',checkLabHeadAuth,labHead.getRound2);
app.get('/getRound3',checkLabHeadAuth,labHead.getRound3);
app.get('/getResults',checkLabHeadAuth,labHead.getResults);

app.get('/results',checkAdminAuth,admin.getResults);
app.get('/printResults',checkAdminAuth,admin.printResults);
app.get('/round1',checkAdminAuth,getRound.round1);
app.get('/round2',checkAdminAuth,getRound.round2);
app.get('/round3',checkAdminAuth,getRound.round3);
app.post('/doRound1',checkAdminAuth,doRound.round1);
app.post('/doRound2',checkAdminAuth,doRound.round2);
app.post('/doRound3',checkAdminAuth,doRound.round3);

app.get('/getRerank1',checkLabHeadAuth,rerank.getRerank1);
app.get('/getRerank2',checkLabHeadAuth,rerank.getRerank2);
app.post('/resumeRound1',checkAdminAuth,doRound.resumeRound1);
app.post('/resumeRound2',checkAdminAuth,doRound.resumeRound2);

app.post('/resetRound1',checkAdminAuth,resetRound.round1);
app.post('/resetRound2',checkAdminAuth,resetRound.round2);
app.post('/resetRound3',checkAdminAuth,resetRound.round3);


var loopback = '0.0.0.0';
http.createServer(app).listen(app.get('port'),loopback, function(){
  console.log("Express server listening on port " + app.get('port'));
});
