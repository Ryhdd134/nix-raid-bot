const { Schema, model } = require("mongoose");

const BlacklistSchema = new Schema({
    userId: {
        type: String,
        required: true,
    }
});

module.exports = model("Blacklist", BlacklistSchema);