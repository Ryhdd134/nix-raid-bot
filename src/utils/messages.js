const { err, check } = require("../emojis");

module.exports = {
    error: (message, error) => {
        message.reply({ embeds: [{
            title: `${err} | Command Error`,
            description: error,
            color: 13567751
        }]}).catch(e => {})
    },
    success: (message, success) => {
        message.reply({ embeds: [{
            title: `${check} | Command Success`,
            description: success,
            color: 7327495
        }]}).catch(e => {})
    }
}