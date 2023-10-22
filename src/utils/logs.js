const { WEBHOOK_LOGS, ALLOWED_COMMANDS } = require("../config.json");
const axios = require("axios").default;

module.exports = {
    logCommand: (command, member) => {
        if(!ALLOWED_COMMANDS.includes(command.toLowerCase())) {
            axios.post(WEBHOOK_LOGS, {
                embeds: [{
                    title: "Command",
                    description: `**Command:** ${command} executed by **Member:** ${member}`,
                    color: 481231
                }]
            }).catch(err => console.log(err))
        }
    },
    logServer: (guild) => {
        axios.post(WEBHOOK_LOGS, {
            embeds: [{
                title: "New Server Added",
                description: `**Server:** ${guild}(${guild.id})\n**Members:** ${guild.memberCount}`,
                color: 481231
            }]
        }).catch(err => console.log(err))
    }
}