const { Schema, model } = require("mongoose");

const RequestSchema = new Schema(
  {
    user: {
      id: {
        type: String,
      },
      nick_info: {
        type: Array,
      },
    },
    guild_id: {
      type: String,
    },
    requested_channel: {
      type: String,
    },
    role_to_give: {
      type: Array,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = model("roleRequest", RequestSchema);
