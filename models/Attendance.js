const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for marking attendance
const attendanceSchema = new Schema({
    AdmissionNo: {
        type: String,
        required: true
    },
    program:{
        type:String,
        required:true
    },
    course_id: {
        type: String,
        required: true
    },
    section:{
        type:String,
        required:true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    isPresent: {
        type: Boolean,
        default: false
    }
});

// Define models based on the schemas

module.exports =  mongoose.model('Attendance', attendanceSchema);

