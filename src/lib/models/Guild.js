const { Schema, model } = require("mongoose");

const GuildSchema = new Schema(
  {
    id: {
      type: String,
      unique: true,
    },

    is_premium: {
      type: Boolean,
      default: false,
    },

    common: {
      prefix: {
        type: String,
        maxlength: 20,
        default: "/",
      },
      language: { type: String, default: "ru-RU" },

      private_help: { type: Boolean, default: false },
      delete_error_after: { type: Number, default: 10 },
      delete_success_after: { type: Number, default: 20 },
    },

    give_role: {
      // Включена ли функция?
      is_enabled: { type: Boolean, default: false },

      // Тип сообщений
      message_type: { type: String, default: "embed" },

      // Необходимо для использования системы
      require: {
        channels: Array, // Список каналов, в которых можно управлять ролями
        roles: Array, // Список ролей, необходимые для использования системы
      },

      // Игнорируемые каналы/роли
      banned: {
        channels: Array, // Список каналов, которые бот будет игнорировать
        roles: Array, // Список ролей, при наличии которой бот будет игнорировать человека
      },

      // Какой из алгоритмов валидации ника использовать?
      // Планируется сделать настройку на сайте в виде изменения позиций, создания своих тэгов
      // Временно используются установленные регулярные выражения, устанавливаются через сайт\

      // eslint-disable-next-line
      name_regexp: {
        type: String,
        default: "\\[([a-zA-Zа-яА-Я '\\-]+ ?)\\][ _]?\\[(\\d+)\\] ?([a-zA-Z]+[ |_][a-zA-Z]+)",
      },

      // Список слов, на которые бот будет реагировать в указанном канале
      trigger_words: Array,

      // Канал для отправки запросов
      requests_channel: String,

      // Список тэгов и необходимых ролей для управления данной ролью
      tags: [
        {
          names: Array, // Список названий тэга и его аналогов ["LSPD", "ЛСПД"]
          give_roles: Array, // Список ролей, которые необходимо выдать
          manage_roles: Array, // Список ролей, которые могут ей управлять
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
  {
    // Отключаем использования строки версии в объектах
    versionKey: false,
  }
);

module.exports = model("guilds", GuildSchema);
