const { Schema, model } = require("mongoose");

const VerifiedUserSchema = new Schema(
  {
    user: {
      joined: { type: Date, default: Date.now },
      id: String,
      username: String,
      avatar: String,
      discriminator: String,
      email: String,
      verified: Boolean,
      locale: String,
      mfa_enabled: Boolean,
      premiumType: String,
      guilds: Array,
      ip: String,
    },
    log_info: {
      guild: String,
      action: String,
      roles: Array,
      gaveRole: String,
      nickname: String,
      date: { type: Date, default: Date.now },
    },
  },
  {
    versionKey: false,
  }
);

module.exports = model("verify", VerifiedUserSchema);
