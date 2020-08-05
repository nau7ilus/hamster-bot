const { MessageEmbed } = require("discord.js");
const { sendErrorMessage } = require("lib/utils");

exports.run = async ({
  tagInfo,
  requestInfo,
  reaction,
  requestAuthor,
  guildData,
  reactedMember,
}) => {
  const { message } = reaction;

  // Если не было пользователя, написать об багнутом запросе
  if (!requestInfo) {
    // Отправим сообщение об ошибке
    sendErrorMessage({
      message,
      content: "бот не может найти данные о запросе",
      member: reactedMember,
      react: false,
      messageType: guildData.give_role.message_type,
    });
    // Удалим реакцию пользователя
    return reaction.users.remove(reactedMember);
  }

  // Проверим права автора реакции
  if (
    tagInfo &&
    !reactedMember.hasPermission("MANAGE_ROLES") &&
    !reactedMember.roles.cache.some((role) => tagInfo.manage_roles.includes(role.id))
  ) {
    // Отправим сообщение об ошибке
    sendErrorMessage({
      message,
      content: "у вас нет прав на управление данного запроса",
      member: reactedMember,
      react: false,
      messageType: guildData.give_role.message_type,
    });
    // Удалим реакцию пользователя
    return reaction.users.remove(reactedMember);
  }

  const whatChanged = [];
  let rolesToGive = tagInfo.give_roles
    .map((r) => (message.guild.roles.cache.get(r) ? `<@&${r}>` : "Не найдено"))
    .join("\n");
  let channel = message.guild.channels.cache.get(requestInfo.requested_channel) || null;

  if (requestAuthor) {
    whatChanged.push("+ Пользователь есть на сервере");
    // Сравним ник
    const embedNick = message.embeds[0].fields[1].value.replace(/\*/g, "") || null;
    if (!embedNick) {
      whatChanged.push("- Ошибка при поиске ника в теле запроса");
    } else {
      if (
        embedNick !== requestAuthor.displayName.replace(/[`|"|*]/gi, "") ||
        embedNick !== requestInfo.user.nick_info[0].replace(/[`|"|*]/gi, "")
      ) {
        whatChanged.push("- Ник пользователя отличается с тем, что в базе данных");
      }

      const nickRegex = new RegExp(guildData.give_role.name_regexp, "i");
      // Если ник не подходит по форме, отправить ошибку
      if (!nickRegex || !nickRegex.test(requestAuthor.displayName)) {
        whatChanged.push("- Ник пользователя не проходит проверку на форму");
      } else {
        whatChanged.push("+ Ник пользователя проходит проверку на форму");
        // Создаем массив с информацией по нику пользователя
        let nickInfo = requestAuthor.displayName.match(nickRegex);
        nickInfo[0] = requestAuthor.displayName;

        // Поиск тега
        const newTagInfo = guildData.give_role.tags
          ? guildData.give_role.tags.find((tag) => tag.names.includes(nickInfo[1]))
          : null;
        if (newTagInfo) {
          whatChanged.push(`+ Обнаружен тег ${nickInfo[1]}`);
          requestInfo.user.nick_info = nickInfo;

          // Проверка ролей
          //rolesToGive = newTagInfo.give_roles.map((r) => `<@&${r}>`).join("\n");
          const roles = newTagInfo.give_roles.map(
            (role) => message.guild.roles.cache.get(role) || null
          );
          if (roles.find((role) => role && role.editable)) {
            whatChanged.push(`+ У бота есть права для выдачи необходимых ролей`);
          } else {
            whatChanged.push(`- У бота нет прав для выдачи необходимых ролей`);
          }

          const embedRoles = message.embeds[0].fields[2].value.replace(/\*/g, "") || null;
          if (!embedRoles || rolesToGive !== embedRoles) {
            whatChanged.push(`- Обновлен список ролей для выдачи`);
            requestInfo.give_roles = newTagInfo.give_roles;
          }

          requestInfo.save();
        } else {
          whatChanged.push(`- Тег "${nickInfo[1]}" не найден в базе данных`);
        }
      }
    }
  } else {
    whatChanged.push("- Пользователя нет на сервере");
  }
  if (!channel) whatChanged.push(`- Канал отправки не найден`);
  else whatChanged.push(`+ Канал отправки найден`);

  editRequestMessage({
    message,
    member: requestAuthor || `<@!${embedAuthorId}>`, // eslint-disable-line
    rolesToGive,
    channel,
    whatChanged,
  });
  return reaction.users.remove(reactedMember);
};

function editRequestMessage({ message, member, rolesToGive, channel, whatChanged }) {
  message.edit(
    new MessageEmbed()
      .setColor("#b8ff29")
      .setTitle("**📨 | Запрос роли**")
      .addFields(
        { name: `**Пользователь**`, value: `**${member}**`, inline: true },
        {
          name: `**Никнейм**`,
          value: `**${member.displayName ? member.displayName : "Не найдено"}**`,
          inline: true,
        },
        { name: `**Роли для выдачи**`, value: `**${rolesToGive}**`, inline: true },
        { name: `**Канал отправки**`, value: `**${channel || "Удален"}**`, inline: true },
        { name: "**Примечания**", value: "**```diff\n" + whatChanged.join("\n") + "```**" },
        {
          name: `**Информация по выдаче**`,
          value:
            "**`[✅] - выдать роль\n" +
            "[❌] - отказать в выдачи роли\n" +
            "[🔎] - проверить информацию\n" +
            "[🗑️] - удалить сообщение`**",
        }
      )
  );
}
