const { Schema, model } = require('mongoose');

const RequestSchema = new Schema({
    user: {
        id: {
            type: String
        },
        nickInfo: {
            type: Array
        }
    },
    guildId: {
        type: String
    },
    requestedChannel: {
        type: String
    },
    roleToGive: {
        type: Array
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: `poll`
    }
}, {
    versionKey: false
});

module.exports = model('roleRequest', RequestSchema);