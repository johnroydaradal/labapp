var mongoose = require('mongoose');

var adminSchema = new mongoose.Schema({
    password: String,
    currentSemester: String,
    currentMode: String,
    round1Details: String,
    round2Details: String,
    round3Details: String
});

var labHeadSchema = new mongoose.Schema({
    lab: String,
    password: String 
});

var studentGroupSchema = new mongoose.Schema({
    semester: String,
    number: String,
    names: { type: Array, default: []},
    ranking: { type: Array, default: []}
});

var labSettingSchema = new mongoose.Schema({
    semester: String,
    lab: String,
    required: { type: Number, default: 0} ,
    additional: Number,
    lacking: Number,
    ranking: { type: Array, default: []},
    rankCount: { type: Number, default: 0} ,    // How many ranked in Round1?
    extra: { type: Array, default: []},
    assigned: {type: mongoose.Schema.Types.Mixed, default: {}},
    colorTable: String,
    colorTableDetails: String,
    // round1Details: String,
    // round2Details: String,
    // round3Details: String,
    currentMode: String,
    rerankNeeded : { type: Number, default: 0}  // How many students do you need to rerank?
});


mongoose.model('Admin',adminSchema);
mongoose.model('LabHead',labHeadSchema);
mongoose.model('LabSetting',labSettingSchema);
mongoose.model('StudentGroup',studentGroupSchema);

// mongoose.connect('mongodb://localhost/labApp');
mongoose.connect('mongodb://cs397:cs397@ds063240.mlab.com:63240/labapp');
console.log('DB Connection ok..');

