const Premium = require("../models/Premium");
const { GUILD_ID, ROLE_ID, SECURED_GUILDS, ALLOWED_COMMANDS } = require("../config.json");

module.exports = {
    checkGuildMembers: (guild, client) => {
        if(guild.memberCount <= 15) {
            client.users.cache.get(guild.ownerId).send({ embeds: [{
                    title: "Server Dont Meet Requirements",
                    description: `Your server **${guild.name}** has less than 15 members, please make sure your server has at least 15 members to be able to use the bot`,
                    color: 481231
                }]
            })
            return guild.leave();
        }
    },
    checkUserPremium: async (user, client) => {
        const premium = await Premium.findOne({ userId: user.id });
        if(!premium) {
            return client.users.cache.get(user.id).send({ embeds: [{
                    title: "Wow, you discovered a premium command!",
                    description: `This command is only available for premium users, to get premium, boost us on https://discord.gg/nixakanazis`,
                    color: 481231
                }]
            });
        } else if(!premium.premium) {
            return client.users.cache.get(user.id).send({ embeds: [{
                    title: "Wow, you discovered a premium command!",
                    description: `This command is only available for premium users, to get premium, boost us on https://discord.gg/nixakanazis`,
                    color: 481231
                }]
            });
        }
    },
    makePremiumUsers: async (client) => {
        const guild = client.guilds.cache.get(GUILD_ID);
        const role = guild.roles.cache.get(ROLE_ID);
        const users = guild.members.cache.filter(m => m.roles.cache.has(role.id));
        const premiumUsers = await Premium.find();
        
        premiumUsers.forEach(async (user) => {
            if(!users.has(user.userId)) {
                await Premium.findOneAndDelete({ userId: user.userId });
            } else if(users.has(user.userId) && !user.premium) {
                await Premium.findOneAndUpdate({ userId: user.userId }, { premium: true, premiumSince: Date.now() });
            }         
        });

        users.forEach(async (user) => {
            if(!premiumUsers.find(u => u.userId === user.id) && user.roles.cache.has(role.id)) {
                await Premium.create({ userId: user.id, premium: true, premiumSince: Date.now() });
            } else if(!user.roles.cache.has(role.id) && premiumUsers.find(u => u.userId === user.id)) {
                await Premium.findOneAndDelete({ userId: user.id });
            }
        });
    },
    userIsInGuild: (message, client) => {
        if(!client.guilds.cache.get(GUILD_ID).members.cache.get(message.author.id)) {
            return message.author.send({ embeds: [{
                    title: "Wow, you need to be in our server to use the bot",
                    description: `Join our support server to use the bot https://discord.gg/nixakanazis`,
                    color: 481231
                }]
            });
        }
    }
}