/* eslint-disable consistent-return */
'use strict';

const { MessageEmbed } = require('discord.js');
const { sendErrorMessage, checkPermissions, missingPermsError, localizePerm } = require('../../utils');

exports.run = async ({ tagInfo, requestInfo, reaction, requestAuthor, guildData, reactedMember }) => {
  const { message } = reaction;

  try {
    // Если не было пользователя, написать об ошибке в запросе
    if (!requestInfo || !tagInfo) {
      // Отправим сообщение об ошибке
      sendErrorMessage({
        message,
        content: 'бот не может найти данные о запросе',
        member: reactedMember,
        react: false,
        messageType: guildData.give_role.message_type,
      });
      // Удалим реакцию пользователя
      return reaction.users.remove(reactedMember);
    }

    // Проверим права автора реакции
    if (
      !reactedMember.hasPermission('MANAGE_ROLES') &&
      !reactedMember.roles.cache.some(role => tagInfo.manage_roles.includes(role.id))
    ) {
      // Отправим сообщение об ошибке
      sendErrorMessage({
        message,
        content: 'у вас недостаточно прав для одобрения данного запроса',
        member: reactedMember,
        react: false,
        messageType: guildData.give_role.message_type,
      });
      // Удалим реакцию пользователя
      return reaction.users.remove(reactedMember);
    }

    const channel = message.guild.channels.cache.get(requestInfo.requested_channel) || null;
    const rolesToGive =
      tagInfo.village && message.guild.id === '527799726557364237'
        ? message.member.roles.cache.some(r => r.id === '695387222819471380')
          ? [message.guild.roles.cache.get(tagInfo.give_roles[0])]
          : [message.guild.roles.cache.get(tagInfo.give_roles[1])]
        : tagInfo.give_roles.map(role => message.guild.roles.cache.get(role) || null);

    // Если роли для выдачи не найдены
    if (!rolesToGive || rolesToGive.some(role => !role)) {
      sendErrorMessage({
        message,
        content: 'одна из ролей для выдачи не найдена на сервере',
        member: reactedMember,
        react: false,
        messageType: guildData.give_role.message_type,
      });
      return reaction.users.remove(reactedMember);
    }

    // Проверим права бота на выдачу данных ролей
    if (rolesToGive.some(role => !role || !role.editable)) {
      sendErrorMessage({
        message,
        content: `у бота нет прав на выдачу данной роли. Убедитесь, что у бота есть права '${localizePerm(
          'MANAGE_ROLES',
        )}' и роль, которую необходимо выдать находится ниже роли бота`,
        member: reactedMember,
        react: false,
        messageType: guildData.give_role.message_type,
      });
      return reaction.users.remove(reactedMember);
    }

    // Проверка наличия канала на сервере
    if (!channel) {
      sendErrorMessage({
        message,
        content: 'канал для отправки сообщения не найден на сервере',
        member: reactedMember,
        react: false,
        messageType: guildData.give_role.message_type,
      });
    }

    // Проверка прав в канале для отправки сообщения
    const missingPerms = checkPermissions(channel, ['SEND_MESSAGES', 'EMBED_LINKS', 'VIEW_CHANNEL'], message.guild.me);
    if (missingPerms.length > 0) return missingPermsError({ message, missingPerms, channel, react: false });

    // Проверяем роли, которые необходимо снять
    const rolesToRemove = getRolesToRemove(requestAuthor, guildData, tagInfo.give_roles).map(
      role => message.guild.roles.cache.get(role) || null,
    );

    // Проверка наличия ролей, которые надо снять
    if (rolesToRemove.length > 0) {
      // Проверяем права бота на управление данными ролями
      if (rolesToRemove.some(role => !role || !role.editable)) {
        sendErrorMessage({
          message,
          content: `у бота нет прав на снятие ролей '${rolesToRemove
            .map(r => r.name)
            .join(', ')}'. Убедитесь, что у бота есть права '${localizePerm(
            'MANAGE_ROLES',
          )}' и позиция данных ролей находится ниже роли бота`,
          member: reactedMember,
          react: false,
          messageType: guildData.give_role.message_type,
        });
        return reaction.users.remove(reactedMember);
      }

      for await (const role of rolesToRemove) {
        requestAuthor.roles.remove(role, '[Запрос роли | Cнятие прошлых ролей]');
      }
    }

    // Выдача новых ролей
    for await (const role of rolesToGive) {
      requestAuthor.roles.add(
        role,
        `[Запрос роли | Выдача ролей] ${reactedMember.displayName} [${reactedMember.id}] одобрил запрос`,
      );
    }

    message.channel.send(
      guildData.give_role.message_type === 'plain_text'
        ? // eslint-disable-next-line max-len
          `**\`[✅ | Одобрение] \`${reactedMember}\` одобрил запрос пользователя \`${requestAuthor}\` с ником ${requestInfo.user.nick_info[0].replace(
            /[`|"|*]/gi,
            '',
          )}\`**`
        : new MessageEmbed()
            .setColor('#6cf542')
            .setTitle('**✅ | Одобрение запроса**')
            .setDescription(
              // eslint-disable-next-line max-len
              `**Модератор ${reactedMember} одобрил запрос пользователя ${requestAuthor} с ником \`"${requestInfo.user.nick_info[0].replace(
                /[`|"|*]/gi,
                '',
              )}"\`**`,
            ),
    );

    channel.send(
      guildData.give_role.message_type === 'plain_text'
        ? // eslint-disable-next-line max-len
          `**\`[✅ | Одобрение]\` ${requestAuthor},\` модератор \`${reactedMember} \`одобрил ваш запрос на получение роли "${requestInfo.role_to_give
            .map(role =>
              message.guild.roles.cache.get(role) ? message.guild.roles.cache.get(role).name : 'Не найдено',
            )
            .join(', ')}" с ником "${requestInfo.user.nick_info[0].replace(/[`|"|*]/gi, '')}"\`**`
        : new MessageEmbed()
            .setColor('#6cf542')
            .setTitle('**✅ | Одобрение запроса**')
            .setDescription(
              // eslint-disable-next-line max-len
              `**${requestAuthor}, модератор ${reactedMember} одобрил ваш запрос на получение роли ${requestInfo.role_to_give
                .map(role => `<@&${role}>`)
                .join(', ')} с ником \`${requestInfo.user.nick_info[0].replace(/[`|"|*]/gi, '')}\`**`,
            ),
    );

    requestInfo.remove();
    return message.delete();
  } catch (err) {
    console.error(err);
    sendErrorMessage({
      message,
      content: 'произошла ошибка при попытке выдачи ролей',
      member: reactedMember,
      react: false,
      messageType: guildData.give_role.message_type,
    });
  }
};

function getRolesToRemove(member, guildData, rolesToSkip) {
  return guildData.give_role.tags
    .flatMap(tag => tag.give_roles)
    .filter(
      role =>
        member.guild.roles.cache.some(r => r.id === role) &&
        !rolesToSkip.includes(role) &&
        member.roles.cache.some(r => r.id === role),
    );
}
