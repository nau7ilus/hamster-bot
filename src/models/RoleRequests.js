'use strict';

const { Schema, model } = require('mongoose');

const RequestSchema = new Schema(
  {
    user: {
      id: String,
      nick_info: Array,
    },
    guild_id: String,
    requested_channel: String,
    role_to_give: Array,
  },
  { versionKey: false },
);

module.exports = model('roleRequest', RequestSchema);
