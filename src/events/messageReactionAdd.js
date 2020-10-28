'use strict';

const Guild = require('../models/Guild');
const { onRunError } = require('../utils');

module.exports = async (client, reaction, reactedUser) => {
  // Если информация о реакции неполная, запросить больше
  if (reaction.partial) await reaction.fetch();

  // Если автор бот - выходим
  if (reactedUser.bot) return;

  // Получаем сообщение, пользователей и эмодзи
  const { message } = reaction;

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
      require('./RoleRequests/reactionController')
        .run({ client, reaction, reactedUser, guildData })
        .catch(warning => onRunError({ client, warning, message }));
    }
  }
};
