const Guild = require("../../api/models/Guild"); // Модель сервера
const { onRunError } = require("../../utils");

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
      require("../giveRoles/reactionController")
        .run({ client, reaction, reactedUser, guildSettings })
        .catch((warning) => onRunError({ client, warning, message }));
    }
  }
};
