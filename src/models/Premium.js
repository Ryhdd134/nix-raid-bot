const { Schema, model } = require("mongoose");

const UserPremium = new Schema({
    userId: String,
    premium: Boolean,
    premiumSince: Number
});

module.exports = model("UserPremium", UserPremium);