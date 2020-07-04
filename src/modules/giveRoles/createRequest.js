const { MessageEmbed } = require("discord.js"); // Для отправки сообщений типа ембед
const { checkClientPermissions, missingPermsError, sendErrorMessage } = require("../../utils");
const RoleRequests = require("../../api/models/RoleRequests"); // Для логирования запросов

exports.run = async ({ message, guildSettings }) => {
  // TODO: Добавить в БД возможность удалять сообщения автора,
  // бота по интервалу или вообще не отвечать

  // TODO: Добавить для премиум серверов (Аризона) поиск пользователя на сайте проекта

  // Проверяем, разрешено ли использование системы в данном канале
  if (
    guildSettings.give_role.require.channels &&
    guildSettings.give_role.require.channels.length !== 0 &&
    guildSettings.give_role.require.channels.includes(message.channel.id) &&
    guildSettings.give_role.banned.channels &&
    guildSettings.give_role.banned.channels.length !== 0 &&
    !guildSettings.give_role.banned.channels.includes(message.channel.id)
  ) {
    // Проверяем, разрешено ли пользователю использовать систему
    if (
      guildSettings.give_role.require.roles &&
      guildSettings.give_role.require.roles.length !== 0 &&
      message.member.roles.cache.some((role) =>
        guildSettings.give_role.require.roles.includes(role.id)
      ) &&
      guildSettings.give_role.banned.roles &&
      guildSettings.give_role.banned.roles.length !== 0 &&
      message.member.roles.cache.some(
        (role) => !guildSettings.give_role.banned.roles.includes(role.id)
      )
    ) {
      // Проверяем права бота на отправление сообщений, добавление реакций
      const missingPerms = checkClientPermissions(message.channel, [
        "SEND_MESSAGES",
        "ADD_REACTIONS",
        "EMBED_LINKS",
      ]);
      if (missingPerms.length > 0)
        return missingPermsError({
          message,
          missingPerms,
          channel: message.channel,
        });

      // Проверяем форму ника. Создаем регулярное выражение по тому, что указано в БД
      const nickRegex = new RegExp(guildSettings.give_role.name_regexp, "i");

      // Если ник не подходит по форме, отправить ошибку
      if (!nickRegex || !nickRegex.test(message.member.displayName)) {
        return sendErrorMessage({
          message,
          member: message.member,
          guildSettings,
          content: "ваш ник не соответствует форме",
        });
      }

      // Создаем массив с информацией по нику пользователя
      let nickInfo = message.member.displayName.match(nickRegex);
      nickInfo[0] = message.member.displayName;

      // Если в БД уже есть активный запрос от данного человека, отправить ошибку
      if (
        await RoleRequests.findOne({
          "user.id": message.member.id,
          guild_id: message.guild.id,
          status: "poll",
        })
      ) {
        message.react(`⏱️`);
        return sendErrorMessage({
          message,
          member: message.member,
          guildSettings,
          emoji: "⏱️",
          color: "#24f0ff",
          content: "вы уже отправляли запрос. Ожидайте рассмотрения заявки модераторами",
        });
      }

      // Ищем тег пользователя в базе данных
      const tagInfo = guildSettings.give_role.tags
        ? guildSettings.give_role.tags.find((tag) => tag.names.includes(nickInfo[1]))
        : null;

      // Если указанного тега нет, отправить сообщение об ошибке
      if (!tagInfo) {
        return sendErrorMessage({
          message,
          member: message.member,
          guildSettings,
          content: `тег '${nickInfo[1].replace(/`/, "")}' не найден в настройках сервера`,
        });
      }

      if (!message.guild.roles.cache.some((role) => tagInfo.give_roles.includes(role.id))) {
        return sendErrorMessage({
          message,
          member: message.member,
          guildSettings,
          content: `одна из ролей для выдачи тега '${
				nickInfo[1].replace(/`/,"")}' не найдена на сервере` // prettier-ignore
        });
      }

      // Проверим, есть ли у пользователя уже роли, которые предусматривает тег
      if (checkUserRoles(message.member, tagInfo.give_roles)) {
        return sendErrorMessage({
          message,
          member: message.member,
          guildSettings,
          content: "у вас уже есть роли, которые предусматривает данный тег",
        });
      }

      // Поиск канала для отправки запроса
      const requestsChannel =
        message.guild.channels.cache.get(guildSettings.give_role.requests_channel) || null;

      // Если канала нет, отправить ошибку об этом
      if (!requestsChannel) {
        return sendErrorMessage({
          message,
          member: message.member,
          guildSettings,
          content: `канал для отправки запроса не найден на сервере`,
        });
      }

      // Проверяем права бота в канале для запроса ролей
      const requestChannelPerms = checkClientPermissions(requestsChannel, [
        "SEND_MESSAGES",
        "ADD_REACTIONS",
        "EMBED_LINKS",
        "MANAGE_MESSAGES",
        "VIEW_CHANNEL",
      ]);
      if (requestChannelPerms.length > 0)
        return missingPermsError({
          message,
          missingPerms: requestChannelPerms,
          channel: requestsChannel,
        });

      // Если все подходит, отправить запрос в указанный канал
      requestsChannel
        .send(
          new MessageEmbed()
            .setColor(guildSettings.common.color)
            .setTitle(`**📨 | Запрос роли**`)

            // TODO: Обдумать стиль смайликов. Если можно, сделать кастомные на сервере бота
            .addFields(
              { name: `**Пользователь**`, value: `**${message.member}**`, inline: true },
              {
                name: `**Никнейм**`,
                value: `**${nickInfo[0].replace(/[`|"|*]/gi, "")}**`,
                inline: true,
              },
              {
                name: `**Роли для выдачи**`,
                value: `**${tagInfo.give_roles.map((r) => `<@&${r}>`).join("\n")}**`,
                inline: true,
              },
              { name: `**Канал отправки**`, value: `**${message.channel}**`, inline: true },
              {
                name: `**Информация по выдаче**`,
                value:
                  "**`[✅] - выдать роль\n" +
                  "[❌] - отказать в выдачи роли\n" +
                  "[🔎] - проверить информацию\n" +
                  "[🗑️] - удалить сообщение`**",
              }
            )
        )
        .then(async (msg) => {
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
        guildSettings.give_role.message_type == "plain_text"
          ? "**`[✅ | Запрос отправлен] Запрос был успешно отправлен. Ожидайте проверку заявки модератором`**"
          : new MessageEmbed()
              .setColor("#6cf542")
              .setTitle("**✅ | Запрос отправлен**")
              .setDescription(
                "**Запрос был успешно отправлен. Ожидайте проверку заявки модератором**"
              )
      );
    } else {
      // Если у пользователя нет прав использовать систему ролей, отправить сообщение
      return sendErrorMessage({
        message,
        member: message.member,
        guildSettings,
        content: `вы не можете запрашивать роли`,
      });
    }
  } else {
    // Если используется в запрещенном канале, отправить сообщение
    return sendErrorMessage({
      message,
      member: message.member,
      guildSettings,
      content: `вы не можете запрашивать роли в этом канале`,
    });
  }
};

function checkUserRoles(member, roles) {
  const avaiableRoles = [];
  roles.forEach((role) => {
    if (member.roles.cache.some((r) => r.id == role)) {
      avaiableRoles.push(role);
    }
  });
  return avaiableRoles.length == roles.length;
}
