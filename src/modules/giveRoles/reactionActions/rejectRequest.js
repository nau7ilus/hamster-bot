const { MessageEmbed } = require("discord.js");
const { sendErrorMessage, checkClientPermissions, missingPermsError } = require("../../../utils");

exports.run = async ({
  tagInfo,
  requestInfo,
  reaction,
  requestAuthor,
  guildSettings,
  reactedMember,
}) => {
  // Получим сообщение и эмодзи из реакции
  const { message } = reaction;

  // Если не было пользователя, написать об багнутом запросе
  if (!requestInfo || !tagInfo || !requestAuthor) {
    // Отправим сообщение об ошибке
    sendErrorMessage({
      message,
      content: "бот не может найти данные о запросе",
      member: reactedMember,
      guildSettings,
    });
    // Удалим реакцию пользователя
    return reaction.users.remove(reactedMember);
  }

  // Проверим права автора реакции
  if (
    !reactedMember.hasPermission("MANAGE_ROLES") &&
    !reactedMember.roles.cache.some((role) => tagInfo.manage_roles.includes(role.id))
  ) {
    // Отправим сообщение об ошибке
    sendErrorMessage({
      message,
      content: "у вас нет прав на отклонение данного запросом",
      member: reactedMember,
      guildSettings,
    });
    // Удалим реакцию пользователя
    return reaction.users.remove(reactedMember);
  }

  // Проверяем наличие канала для отправки сообщения
  const channel = message.guild.channels.cache.get(requestInfo.requested_channel) || null;
  if (!channel) {
    // Отправим сообщение об ошибке
    sendErrorMessage({
      message,
      content: "ошибка при поиске канала отправки",
      member: reactedMember,
      guildSettings,
    });
    // Удалим реакцию пользователя
    return reaction.users.remove(reactedMember);
  }

  // Проверяем права бота в канале для отправки сообщения
  const missingPerms = checkClientPermissions(channel, [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "VIEW_CHANNEL",
  ]);
  if (missingPerms.length > 0)
    return missingPermsError({ message, missingPerms, channel, react: false });

  // Отклоняем запрос
  message.channel.send(
    guildSettings.give_role.message_type == "plain_text"
      ? // prettier-ignore
        `**\`[❌ | Отклонение] \`${reactedMember}\` отклонил запрос пользователя \`${requestAuthor
			}\` с ником ${requestInfo.user.nick_info[0].replace(/[`|"|*]/gi, "")}\`**`
      : new MessageEmbed()
          .setColor("#e34536")
          .setTitle("**❌ | Отклонение запроса**")
          .setDescription(
            `**Модератор ${reactedMember} отклонил запрос пользователя ${ // prettier-ignore
				requestAuthor} с ником \`"${requestInfo.user.nick_info[0]
					.replace(/[`|"|*]/gi, "")}"\`**` // prettier-ignore
          )
  );
  channel.send(guildSettings.give_role.message_type == "plain_text" ?
		// prettier-ignore
			`**\`[❌ | Отклонение]\` ${requestAuthor},\` модератор \`${ // prettier-ignore
				reactedMember} \`отклонил ваш запрос на получение роли "${requestInfo.role_to_give.map(
					role => message.guild.roles.cache.get(role) ? message.guild.roles.cache.get(role).name : "Не найдено").join(", ")
				}" с ником "${requestInfo.user.nick_info[0].replace(/[`|"|*]/gi, "")}"\`**` : // prettier-ignore
			new MessageEmbed()
				.setColor('#e34536')
				.setTitle("**❌ | Отклонение запроса**")
				.setDescription(`**${requestAuthor}, модератор ${ // prettier-ignore
					reactedMember} отклонил ваш запрос на получение роли ${requestInfo.role_to_give.map(
					role => `<@&${role}>`).join(", ")} с ником \`${
					requestInfo.user.nick_info[0].replace(/[`|"|*]/gi, "")}\`**`)) // prettier-ignore
  requestInfo.remove();
  return message.delete();
};
