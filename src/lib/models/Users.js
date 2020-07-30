const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
  {
    id: {
      type: String,
      unique: true,
    },
    username: {
      type: String,
    },
    avatar: {
      type: String,
    },
    joined: {
      type: Date,
      default: Date.now,
    },
    discriminator: {
      type: String,
    },
    email: {
      type: String,
    },
    verified: {
      type: Boolean,
    },
    locale: {
      type: String,
    },
    mfa_enabled: {
      type: Boolean,
    },
    premiumType: {
      type: Number,
    },
    guilds: {
      type: Array,
    },
    connections: {
      type: Array,
    },
    ip: {
      type: String,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = model("user", UserSchema);
