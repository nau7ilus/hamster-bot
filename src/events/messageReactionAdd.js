const Guild = require("lib/models/Guild");
const { onRunError } = require("lib/utils");

module.exports = async (client, reaction, reactedUser) => {
  // Если автор бот - выходим
  if (reactedUser.bot) return;

  // Получаем сообщение, пользователей и эмодзи
  const { message } = reaction;

  // Выдача роли тестировщика/обновлений бота на сервере бота
  if (message.guild.id === "625036675059548220") {
    if (message.channel.id !== "685637641487777918") return;
    if (message.author.id !== client.user.id) return;
    if (reaction.emoji.name === "📯") {
      const roleToGive = message.guild.roles.cache.get("685688643847061525");
      const userForRole = message.guild.members.cache.get(reactedUser.id);
      userForRole.roles.add(roleToGive);
    }
    if (reaction.emoji.name == "🙋") {
      const roleToGive = message.guild.roles.cache.get("625318204071215151");
      const userForRole = message.guild.members.cache.get(reactedUser.id);
      userForRole.roles.add(roleToGive);
    }
  }

  // Проверяем на наличие сервера.
  // Так как, некоторые команды разрешено использовать в ЛС, необходимо проверить наличие сервера
  const isGuild = !!message.guild;
  let guildData = isGuild ? await Guild.findOne({ id: message.guild.id }).cache() : null;
  if (isGuild && !guildData) guildData = await Guild.create({ id: message.guild.id });

  // Проверяем, включена ли система выдачи ролей
  if (guildData && guildData.give_role.is_enabled && guildData.give_role.requests_channel) {
    // Если в канале для запроса роли
    const requests_channel = message.guild.channels.cache.get(guildData.give_role.requests_channel);
    if (requests_channel && message.channel.id === requests_channel.id) {
      require("./RoleRequests/reactionController")
        .run({ client, reaction, reactedUser, guildData })
        .catch((warning) => onRunError({ client, warning, message }));
    }
  }
};
