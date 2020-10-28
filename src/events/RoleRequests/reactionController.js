'use strict';

const RoleRequests = require('../../models/RoleRequests');
const { checkPermissions, missingPermsError } = require('../../utils');

/**
 * TODO: При выходе пользователя с сервера, убирать все его заявки в БД
 * Возможность ставить больше, чем один пробел в нике
 * Дать возможность ставить другие теги в ник
 */

exports.run = async ({ client, reaction, reactedUser, guildData }) => {
  // Если система выдачи ролей выключена, выходим
  if (!guildData.give_role.is_enabled) return;

  // Получим сообщение и эмодзи из реакции
  const { message, emoji } = reaction;
  const reactedMember = await message.guild.members.fetch(reactedUser.id);
  if (!reactedMember) return;

  // Если автор сообщения не бот, выходим
  if (message.author.id !== client.user.id) return;
  // Если нет вложения, выходим
  if (!message.embeds) return;

  // Проверяем название сообщения
  const embedName = message.embeds[0].title || null;
  if (!embedName || embedName !== '**📨 | Запрос роли**') return;

  // Проверяем права бота в канале запросов
  const missingPerms = checkPermissions(
    message.channel,
    ['SEND_MESSAGES', 'ADD_REACTIONS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'VIEW_CHANNEL'],
    message.guild.me,
  );
  if (missingPerms.length > 0) {
    missingPermsError({
      message,
      missingPerms,
      channel: message.channel,
      react: false,
    });
    return;
  }

  // Получаем пользователя с запроса
  const embedAuthorId = /(?<=<@.?)\d+(?=>)/.test(message.embeds[0].fields[0].value)
    ? message.embeds[0].fields[0].value.match(/(?<=<@.?)\d+(?=>)/)[0]
    : null;
  const requestAuthor = await message.guild.members.fetch(embedAuthorId);

  // Ищем запрос в базе данных
  const requestInfo = await RoleRequests.findOne({
    'user.id': embedAuthorId,
    guild_id: message.guild.id,
  });

  // Найдем тег пользователя в настройках сервера
  const tagInfo = requestInfo
    ? guildData.give_role.tags.find(tag => tag.names.includes(requestInfo.user.nick_info[1]))
    : null;

  if (emoji.name === '✅') run(require('./acceptRequest'));
  else if (emoji.name === '🔎') run(require('./getInfo'));
  else if (emoji.name === '❌') run(require('./rejectRequest'));
  else if (emoji.name === '🗑️') run(require('./deleteRequest'));
  else reaction.users.remove(reactedMember);

  function run(path) {
    return path.run({
      tagInfo,
      requestInfo,
      reaction,
      requestAuthor,
      guildData,
      reactedMember,
    });
  }
};
