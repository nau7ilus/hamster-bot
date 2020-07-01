// Импортируем модули сторонних разработчиков
const { DateTime } = require("luxon"); // Форматирование времени
const { MessageEmbed } = require("discord.js");

// Импортируем собственные модули
const Guild = require("../../api/models/Guild");

module.exports = async (client, reaction, reactedUser) => {
  // Если автор бот - выходим
  if (reactedUser.bot) return;

  // Получаем сообщение, пользователей и эмодзи
  const { message } = reaction;

  // Проверяем, находится ли сервер в базе данных. Если нет, создать его и обновить кэш
  if (message.guild && client.settings && !client.settings.find((g) => g.id == message.guild.id)) {
    await Guild.create({ id: message.guild.id });
    client.settings = await Guild.find({});
  }

  // Получаем настройки сервера, иначе null
  const guildSettings = client.settings
    ? client.settings.find((g) => g.id == message.guild.id)
    : null;

  // Проверяем, включена ли система выдачи ролей
  if (
    guildSettings &&
    guildSettings.give_role.is_enabled &&
    guildSettings.give_role.requests_channel
  ) {
    // Если в канале для запроса роли
    let requests_channel = message.guild.channels.cache.get(
      guildSettings.give_role.requests_channel
    );
    if (requests_channel && message.channel.id === requests_channel.id) {
      require("../giveRoles/reactionAdd")
        .run({ client, reaction, reactedUser, guildSettings })
        .catch((warning) => {
          console.warn(
            `[GiveRole] [Warn] Произошла ошибка в коде создания запроса Время: ${DateTime.local().toFormat(
              "TT"
            )}\nОшибка: ${warning.stack}`
          );

          // Если автор команды - разработчик, отправить информацию об ошибке, иначе просто факт
          if (client.isDev(reactedUser.id)) {
            return message.channel.send(
              new MessageEmbed()
                .setColor("#ff3333")
                .setDescription(`**Произошла ошибка в коде системы**`)
                .addField(
                  "**Отладка**",
                  `**Автор: ${reactedUser} (\`${reactedUser.id}\`)\nСервер: **${
                    // prettier-ignore
                    message.guild.name
                  }** (\`${
                    message.guild.id // prettier-ignore
                  }\`)\nВ канале: ${message.channel} (\`${message.channel.id})\`**`
                ) // prettier-ignore
                .addField(
                  "**Ошибка**",
                  warning.stack.length > 1024
                    ? warning.stack.substring(0, 1021) + "..."
                    : warning.stack
                )
            );
          } else {
            console.log(2);

            return message.channel.send(
              new MessageEmbed()
                .setColor("#ff3333")
                .setTitle("**🚫 | Ошибка**")
                .setDescription(
                  "**Произошла ошибка в коде команды. Сообщите разработчикам об этом**"
                )
            );
          }
        });
    }
  }
};
