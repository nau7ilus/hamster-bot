const { Schema, model } = require("mongoose");

const AuthSchema = new Schema(
  {
    id: {
      type: String,
      unique: true,
    },
    guild: {
      type: String,
    },
    username: {
      type: String,
    },
    avatar: {
      type: String,
    },
    discriminator: {
      type: String,
    },
    giveType: {
      type: String,
    },
    roles: {
      type: Array,
    },
    gaveRole: {
      type: String,
    },
    nickname: {
      type: String,
    },
    isMuted: {
      type: Boolean,
    },
    isDeafen: {
      type: Boolean,
    },
    ip: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = model("authLog", AuthSchema);
