/* eslint-disable no-warning-comments */
'use strict';

const { MessageEmbed } = require('discord.js');

const RoleRequests = require('models/RoleRequests');
const Command = require('structures/Command');
const { checkPermissions, missingPermsError, sendErrorMessage } = require('utils');

module.exports = class extends Command {
  // TODO: Добавить в БД возможность удалять сообщения автора,
  // бота по интервалу или вообще не отвечать

  // TODO: Добавить для премиум серверов (Аризона) поиск пользователя на сайте проекта

  constructor(...args) {
    super(...args, {
      name: 'supersecretcommand',
      devOnly: true,
    });
  }

  async run({ message, guildData }) {
    const requestSettings = guildData.give_role;

    // Проверяем, разрешено ли использование системы в данном канале
    const checkChannel = () => {
      const arr = [];
      if (requestSettings.require.channels.length > 0) arr.push('require');
      if (requestSettings.banned.channels.length > 0) arr.push('banned');
      return arr;
    };
    if (
      (checkChannel().includes('require') &&
        !requestSettings.require.channels.includes(message.channel.id)) ||
      (checkChannel().includes('banned') && requestSettings.banned.channels.includes(message.channel.id))
    ) {
      return sendErrorMessage({
        message,
        member: message.member,
        content: `вы не можете запрашивать роли в этом канале`,
        messageType: guildData.give_role.message_type,
      });
    }

    // Проверяем права пользователя
    const checkRoles = () => {
      const arr = [];
      if (requestSettings.require.roles.length > 0) arr.push('require');
      if (requestSettings.banned.roles.length > 0) arr.push('banned');
      return arr;
    };
    if (
      (checkRoles().includes('require') &&
        !message.member.roles.cache.some(role => guildData.give_role.require.roles.includes(role.id))) ||
      (checkRoles().includes('banned') &&
        message.member.roles.cache.some(role => guildData.give_role.banned.roles.includes(role.id)))
    ) {
      return sendErrorMessage({
        message,
        member: message.member,
        content: `вы не можете запрашивать роли`,
        messageType: guildData.give_role.message_type,
      });
    }

    // Проверяем права бота на отправление сообщений, добавление реакций
    const missingPerms = checkPermissions(
      message.channel,
      ['SEND_MESSAGES', 'ADD_REACTIONS', 'EMBED_LINKS'],
      message.guild.me,
    );
    if (missingPerms.length > 0) {
      return missingPermsError({
        message,
        missingPerms,
        channel: message.channel,
      });
    }

    // Проверяем форму ника. Создаем регулярное выражение по тому, что указано в БД
    const nickRegex = new RegExp(requestSettings.name_regexp, 'i');

    // Если ник не подходит по форме, отправить ошибку
    if (!nickRegex || !nickRegex.test(message.member.displayName)) {
      return sendErrorMessage({
        message,
        member: message.member,
        content: 'ваш ник не соответствует форме',
        messageType: guildData.give_role.message_type,
      });
    }

    // Создаем массив с информацией по нику пользователя
    let nickInfo = message.member.displayName.match(nickRegex);
    nickInfo[0] = message.member.displayName;

    // Если в БД уже есть активный запрос от данного человека, отправить ошибку
    if (
      await RoleRequests.findOne({
        'user.id': message.member.id,
        guild_id: message.guild.id,
      })
    ) {
      message.react(`⏱️`);
      return sendErrorMessage({
        message,
        member: message.member,
        emoji: '⏱️',
        color: '#24f0ff',
        content: 'вы уже отправляли запрос. Ожидайте рассмотрения заявки модераторами',
        messageType: guildData.give_role.message_type,
      });
    }

    // Ищем тег пользователя в базе данных
    const tagInfo = requestSettings.tags
      ? requestSettings.tags.find(tag => tag.names.includes(nickInfo[1]))
      : null;

    // Если указанного тега нет, отправить сообщение об ошибке
    if (!tagInfo) {
      return sendErrorMessage({
        message,
        member: message.member,
        content: `тег '${nickInfo[1].replace(/`/g, '')}' не найден в настройках сервера`,
        messageType: guildData.give_role.message_type,
      });
    }

    if (!message.guild.roles.cache.some(role => tagInfo.give_roles.includes(role.id))) {
      return sendErrorMessage({
        message,
        member: message.member,
        messageType: guildData.give_role.message_type,
        content: `одна из ролей для выдачи по тегу '${nickInfo[1].replace(/`/g, '')}' не найдена на сервере`,
      });
    }

    // Проверим, есть ли у пользователя уже роли, которые предусматривает тег
    if (checkUserRoles(message.member, tagInfo.give_roles)) {
      return sendErrorMessage({
        message,
        member: message.member,
        content: 'у вас уже есть роли, которые предусматривает данный тег',
        messageType: guildData.give_role.message_type,
      });
    }

    // Поиск канала для отправки запроса
    const requestsChannel = message.guild.channels.cache.get(requestSettings.requests_channel) || null;

    // Если канала нет, отправить ошибку об этом
    if (!requestsChannel) {
      return sendErrorMessage({
        message,
        member: message.member,
        content: `канал для отправки запроса не найден на сервере`,
        messageType: guildData.give_role.message_type,
      });
    }

    // Проверяем права бота в канале для запроса ролей
    const requestChannelPerms = checkPermissions(
      requestsChannel,
      ['SEND_MESSAGES', 'ADD_REACTIONS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'VIEW_CHANNEL'],
      message.guild.me,
    );
    if (requestChannelPerms.length > 0) {
      return missingPermsError({
        message,
        missingPerms: requestChannelPerms,
        channel: requestsChannel,
      });
    }

    // Если все подходит, отправить запрос в указанный канал
    requestsChannel
      .send(
        new MessageEmbed()
          .setColor('#b8ff29')
          .setTitle(`**📨 | Запрос роли**`)

          // TODO: Обдумать стиль смайликов. Если можно, сделать кастомные на сервере бота
          .addFields(
            { name: `**Пользователь**`, value: `**${message.member}**`, inline: true },
            {
              name: `**Никнейм**`,
              value: `**${nickInfo[0].replace(/[`|*]/gi, '')}**`,
              inline: true,
            },
            {
              name: `**Роли для выдачи**`,
              value: `**${tagInfo.give_roles.map(r => `<@&${r}>`).join('\n')}**`,
              inline: true,
            },
            { name: `**Канал отправки**`, value: `**${message.channel}**`, inline: true },
            {
              name: `**Информация по выдаче**`,
              value:
                '**`[✅] - выдать роль\n' +
                '[❌] - отказать в выдачи роли\n' +
                '[🔎] - проверить информацию\n' +
                '[🗑️] - удалить сообщение`**',
            },
          ),
      )
      .then(async msg => {
        await msg.react(`✅`);
        await msg.react(`❌`);
        await msg.react(`🔎`);
        await msg.react(`🗑️`);
        msg.pin();

        // Сохраняем информацию о запросе в базу данных
        await RoleRequests.create({
          user: {
            id: message.member.id,
            nick_info: nickInfo,
          },
          guild_id: message.guild.id,
          requested_channel: message.channel.id,
          role_to_give: tagInfo.give_roles,
        });
      });

    // Если все удачно, отправить сообщение
    message.react(`✅`);
    return message.channel.send(
      requestSettings.message_type === 'plain_text'
        ? '**`[✅ | Запрос отправлен] Запрос был успешно отправлен. Ожидайте проверку заявки модератором`**'
        : new MessageEmbed()
            .setColor('#6cf542')
            .setTitle('**✅ | Запрос отправлен**')
            .setDescription('**Запрос был успешно отправлен. Ожидайте проверку заявки модератором**'),
    );
  }
};

function checkUserRoles(member, roles) {
  const avaiableRoles = [];
  roles.forEach(role => {
    if (member.roles.cache.some(r => r.id === role)) {
      avaiableRoles.push(role);
    }
  });
  return avaiableRoles.length === roles.length;
}
