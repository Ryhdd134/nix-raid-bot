const { Schema, model } = require("mongoose");

const GuildRaid = new Schema({
    guildId: String,
    guildName: String,
    raidDate: Number,
    raiderId: String
});

module.exports = model("GuildRaid", GuildRaid);