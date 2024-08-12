const mongoose = require("mongoose");
const Schema = mongoose.Schema;


// Define the schema for a course
const courseSchema = new Schema({
    courseId: {
        type: String,
        required: true,
        unique: true
    },
    courseName: {
        type: String,
        required: true
    },
    program:{
        type:String,
        required:true
    }
    // Other course details can be added here
});


module.exports = mongoose.model('Course', courseSchema);
