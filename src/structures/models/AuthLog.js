const { Schema, model } = require('mongoose');

const AuthSchema = new Schema({
    id: {
        type: String,
        unique: true
    },
    ip: {
        type: String
    },
    email: {
        type: String
    },
    joined: {
        type: Date,
        default: Date.now
    },
}, {
    versionKey: false
});

module.exports = model('authLog', AuthSchema);;