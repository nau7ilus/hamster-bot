'use strict';

const { Schema, model } = require('mongoose');

const GuildSchema = new Schema(
  {
    id: { type: String, unique: true },
    is_premium: { type: Boolean, default: false },
    common: {
      prefix: { type: String, maxlength: 20, default: '/' },
      language: { type: String, default: 'ru-RU' },
      private_help: { type: Boolean, default: false },
      delete_error_after: { type: Number, default: 10 },
      delete_success_after: { type: Number, default: 20 },
    },

    give_role: {
      is_enabled: { type: Boolean, default: false },
      message_type: { type: String, default: 'embed' },
      require: { channels: Array, roles: Array },
      banned: { channels: Array, roles: Array },

      name_regexp: {
        type: String,
        default: "\\[([a-zA-Zа-яА-Я '\\-]+ ?)\\][ _]?\\[(\\d+)\\] ?([a-zA-Z]+[ |_][a-zA-Z]+)",
      },
      trigger_words: Array,
      requests_channel: String,
      tags: [
        {
          names: Array,
          give_roles: Array,
          manage_roles: Array,
          mention: Array,
          village: { type: Boolean, default: false },
        },
      ],
    },

    commands: {
      misc: {
        help: {
          is_enabled: { type: Boolean, default: true },
          nsfw: { type: Boolean, default: false },
          delete_src: { type: Boolean, default: false },
        },
      },
    },
  },
  { versionKey: false },
);

module.exports = model('guilds', GuildSchema);
