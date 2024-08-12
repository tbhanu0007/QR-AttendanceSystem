const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  program: {
    type: String,
    required: true,
  },
  Id: {
    type: String,
    required: true,

  },
  password: {
    type: String,
    required: true,
  },
  
});

module.exports = mongoose.model("Admin", adminSchema);
