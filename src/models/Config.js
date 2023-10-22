const { Schema, model } = require("mongoose");

const PremiumConfig = new Schema({
    userId: String,
    channelsName: {
        default: "raid-by-nixsquad #code by nsnt",
        type: String
    },
    spamMsg: {
        default: "@everyone Coded By Nsnt",
        type: String
    },
    serverName: {
        default: "Coded By Nsnt",
        type: String
    },
    serverIcon: {
        default: "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif",
        type: String
    },
    autoRaidServer: {
        default: false,
        type: Boolean
    }
});

module.exports = model("PremiumConfig", PremiumConfig);