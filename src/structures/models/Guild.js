// Еще не готово
const { Schema, model } = require('mongoose');

const GuildSchema = new Schema({
    id: {
        type: String,
        unique: true
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    common: {
        prefix: {
            type: String,
            maxlength: 20,
            default: '/'
        },
        locale: String,
        color: {
            type: String,
            default: '#b5ff33'
        }
    },
    // Добавить audit, leaders, welcome, commands
    custom: [
        {
            enabled: {
                type: Boolean,
                default: true
            },
            ignoredChannels: [],
            ignoredRoles: [],
            requiredChannels: [],
            requiredRoles: [],
            deleteSrc: 0,
            description: String,
            name: String,
            nsfw: Boolean,
            cooldown: {
                type: String, // user, guild, channel
                time: Number
            },
            actions: [
                {
                    type: String, // [message, addRole, removeRole, if, else, endif, var]
                    roles: [],
                    message: {
                        deleteAfter: 0,
                        content: String,
                        tts: Boolean,
                        embed: {
                            color: String
                        }
                    }
                }
            ]
        }
    ]
}, {
    versionKey: false
});

module.exports = model('guilds', GuildSchema);;