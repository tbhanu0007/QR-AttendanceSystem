const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classesSchema = new Schema({
    program:{
        type:String,
        required:true
    },
    course_id:{
        type:String,
        required:true
    },
    section:{
        type:String,
        required:true
    },
    dateAndTime:{
        type:Date,
        required:true,
        default:Date.now()
    }
});

module.exports = mongoose.model('Classes',classesSchema);