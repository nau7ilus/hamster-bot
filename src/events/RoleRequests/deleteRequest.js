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
  // Получим сообщение и эмодзи из реакции
  const { message } = reaction;

  // Если не было пользователя, написать об багнутом запросе
  if (!requestAuthor || !requestInfo || !tagInfo) {
    message.channel.send(
      guildData.give_role.message_type == "plain_text"
        ? `**\`[🗑️ | Удаление] \`${reactedMember}\` удалил багнутый запрос роли\`**`
        : new MessageEmbed()
            .setColor("#b4c1d6")
            .setTitle("**🗑️ | Удаление запроса**")
            .setDescription(`**${reactedMember} удалил багнутый запрос роли**`)
    );

    // Если есть данные о запросе, поставить статус как удаленный
    if (requestInfo) requestInfo.remove();
    return message.delete();
  }

  // Проверим права автора реакции
  if (
    !reactedMember.hasPermission("MANAGE_ROLES") &&
    !reactedMember.roles.cache.some((role) => tagInfo.manage_roles.includes(role.id))
  ) {
    // Отправим сообщение об ошибке
    sendErrorMessage({
      message,
      content: "у вас нет прав на удаление данного запроса",
      member: reactedMember,
      react: false,
      messageType: guildData.give_role.message_type,
    });
    // Удалим реакцию пользователя
    return reaction.users.remove(reactedMember);
  }

  // Удаляем запрос
  message.channel.send(
    guildData.give_role.message_type == "plain_text"
      ? // prettier-ignore
        `**\`[🗑️ | Удаление]\` ${reactedMember} \`удалил запрос пользователя\` ${requestAuthor
			} \`с ником ${requestInfo.user.nick_info[0].replace(/[`|"|*]/gi, "")}\`**`
      : new MessageEmbed()
          .setColor("#b4c1d6")
          .setTitle("**🗑️ | Удаление запроса**")
          .setDescription(
            `**${reactedMember} удалил запрос пользователя ${ 
				requestAuthor} с ником \`${requestInfo.user.nick_info[0]
					.replace(/[`|"|*]/gi, "")}\`**` // prettier-ignore
          )
  );
  requestInfo.remove();
  return message.delete();
};
