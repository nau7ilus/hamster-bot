const RoleRequests = require("../../api/models/RoleRequests"); // Для логирования запросов
const { checkClientPermissions, missingPermsError } = require("../../utils");

/**
 * TODO: При выходе пользователя с сервера, убирать все его заявки в БД
 * Возможность ставить больше, чем один пробел в нике
 * Дать возможность ставить другие теги в ник
 */

exports.run = async ({ client, reaction, reactedUser, guildSettings }) => {
  // Если система выдачи ролей выключена, выходим
  if (!guildSettings.give_role.is_enabled) return;

  // Получим сообщение и эмодзи из реакции
  const { message, emoji } = reaction;
  const reactedMember = message.guild.member(reactedUser);
  if (!reactedMember) return;

  // Если автор сообщения не бот, выходим
  if (message.author.id !== client.user.id) return;
  // Если нет вложения, выходим
  if (!message.embeds) return;

  // Проверяем название сообщения
  const embedName = message.embeds[0].title || null;
  if (!embedName || embedName !== "**📨 | Запрос роли**") return;

  // Проверяем права бота в канале запросов
  const missingPerms = checkClientPermissions(message.channel, [
    "SEND_MESSAGES",
    "ADD_REACTIONS",
    "EMBED_LINKS",
    "MANAGE_MESSAGES",
    "VIEW_CHANNEL",
  ]);
  if (missingPerms.length > 0)
    return missingPermsError({
      message,
      missingPerms,
      channel: message.channel,
      react: false,
    });

  // Получаем пользователя с запроса
  const embedAuthorId = /(?<=<@.?)\d+(?=>)/.test(message.embeds[0].fields[0].value)
    ? message.embeds[0].fields[0].value.match(/(?<=<@.?)\d+(?=>)/)[0]
    : null;
  const requestAuthor = message.guild.members.cache.find((m) => m.id === embedAuthorId);

  // Ищем запрос в базе данных
  const requestInfo = await RoleRequests.findOne({
    "user.id": embedAuthorId,
    status: "poll",
    guild_id: message.guild.id,
  });

  // Найдем тег пользователя в настройках сервера
  const tagInfo = requestInfo
    ? guildSettings.give_role.tags.find((tag) => tag.names.includes(requestInfo.user.nick_info[1]))
    : null;

  if (emoji.name == "✅") return run(require("./reactionActions/acceptRequest"));
  if (emoji.name == "🔎") return run(require("./reactionActions/getInfo"));
  if (emoji.name == "❌") return run(require("./reactionActions/rejectRequest"));
  if (emoji.name == "🗑️") return run(require("./reactionActions/deleteRequest"));

  function run(path) {
    return path.run({
      tagInfo,
      requestInfo,
      reaction,
      requestAuthor,
      guildSettings,
      reactedMember,
    });
  }
};
