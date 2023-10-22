const { DB } = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(DB).then(() => console.log("Connected to DB")).catch(err => console.log(err));