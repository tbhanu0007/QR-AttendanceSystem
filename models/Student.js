const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for a student
const studentSchema = new Schema({
    AdmissionNo: {
        type: String,
        required: true,
        unique: true
    },
    name:{
        type:String,
        required:true
    },
    program:{
        type:String,
        required:true
    },
    section:{
        type:String,
        required:true
    },
    password: {
        type: String,
        required: true,
    },
    
    // Other student details can be added here
});

module.exports = mongoose.model('Student', studentSchema);
