const { MessageEmbed } = require('discord.js');
const RoleRequests = require('../../api/models/RoleRequests'); // Для логирования запросов
const diffUtils = require("../../utils/diff");

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
	if (!message.embeds) return

	// Проверяем название сообщения
	const embedName = message.embeds[0].title || null;
	if (!embedName || embedName !== "**📨 | Запрос роли**") return;

	// Получаем пользователя с запроса
	const embedAuthorId = /(?<=<@.?)\d+(?=>)/.test(message.embeds[0].fields[0].value) ?
		message.embeds[0].fields[0].value.match(/(?<=<@.?)\d+(?=>)/)[0] : null;
	const requestAuthor = message.guild.members.cache.find(m =>
		m.id === embedAuthorId);

	// Ищем запрос в базе данных
	const requestInfo = await RoleRequests.findOne({
		"user.id": embedAuthorId,
		"status": "poll",
		"guild_id": message.guild.id
	});

	// Найдем тег пользователя в настройках сервера
	const tagInfo = requestInfo ? guildSettings.give_role.tags.find(tag =>
		tag.names.includes(requestInfo.user.nick_info[1])) : null;

	if (emoji.name == "✅") {
	}

	if (emoji.name == "🔎") {
		// Если не было пользователя, написать об багнутом запросе
		if (!requestInfo) {
			// Отправим сообщение об ошибке
			sendErrorMessage({
				message, content: "бот не может найти данные о запросе",
				member: reactedMember, guildSettings
			});
			// Удалим реакцию пользователя
			return reaction.users.remove(reactedMember);
		}

		// Проверим права автора реакции
		if (tagInfo && !reactedMember.hasPermission("MANAGE_ROLES") &&
			!reactedMember.roles.cache.some(role => tagInfo.manage_roles.includes(role.id))) {
			// Отправим сообщение об ошибке
			sendErrorMessage({
				message, content: "у вас нет прав на управление данным запроса",
				member: reactedMember, guildSettings
			});
			// Удалим реакцию пользователя
			return reaction.users.remove(reactedMember);

		}

		const whatChanged = [];
		let rolesToGive = tagInfo.give_roles.map(r => `<@&${r}>`).join('\n');
		let channel = message.guild.channels.cache.get(requestInfo.requested_channel) || null;

		if (requestAuthor) {
			whatChanged.push("+ Пользователь есть на сервере");
			// Сравним ник
			const embedNick = message.embeds[0].fields[1].value.replace(/\*/g, '') || null;
			if (!embedNick) {
				whatChanged.push("- Ошибка при поиске ника в теле запроса");
			} else {
				if (embedNick !== requestAuthor.displayName ||
					embedNick !== requestInfo.user.nick_info[0]) {

					whatChanged.push("- Ник пользователя отличается с тем, что в теле запроса");
				}

				const nickRegex = new RegExp(guildSettings.give_role.name_regexp, "i");
				// Если ник не подходит по форме, отправить ошибку
				if (!nickRegex || !nickRegex.test(requestAuthor.displayName)) {
					whatChanged.push("- Ник пользователя не проходит проверку на форму");
				} else {
					whatChanged.push("+ Ник пользователя проходит проверку на форму");
					// Создаем массив с информацией по нику пользователя
					let nickInfo = requestAuthor.displayName.match(nickRegex);
					nickInfo[3] = nickInfo[3] + '_' + nickInfo[4];
					nickInfo.splice(-1, 1);

					// Поиск тега
					const newTagInfo = guildSettings.give_role.tags ?
						guildSettings.give_role.tags.find(tag => tag.names.includes(nickInfo[1])) : null;
					if (newTagInfo) {
						whatChanged.push(`+ Обнаружен тег ${nickInfo[1]}`);
						requestInfo.user.nick_info = nickInfo;

						// Проверка ролей
						rolesToGive = newTagInfo.give_roles.map(r => `<@&${r}>`).join('\n');
						const roles = newTagInfo.give_roles.map(role => message.guild.roles.cache.get(role)
							|| null);
						if (!roles.find(role => !role.editable)) {
							whatChanged.push(`+ У бота есть права для выдачи необходимых ролей`);
						} else {
							whatChanged.push(`- У бота нет прав для выдачи необходимых ролей`);
						}

						const embedRoles = message.embeds[0].fields[2].value.replace(/\*/g, '') || null;
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
			message, guildSettings, member: requestAuthor || `<@!${embedAuthorId}>`,
			rolesToGive, channel, whatChanged
		});
		return reaction.users.remove(reactedMember);
	}

	if (emoji.name == "❌") {
		// Если не было пользователя, написать об багнутом запросе
		if (!requestInfo || !tagInfo || !requestAuthor) {
			// Отправим сообщение об ошибке
			sendErrorMessage({
				message, content: "бот не может найти данные о запросе",
				member: reactedMember, guildSettings
			});
			// Удалим реакцию пользователя
			return reaction.users.remove(reactedMember);
		}

		// Проверим права автора реакции
		if (!reactedMember.hasPermission("MANAGE_ROLES") &&
			!reactedMember.roles.cache.some(role => tagInfo.manage_roles.includes(role.id))) {
			// Отправим сообщение об ошибке
			sendErrorMessage({
				message, content: "у вас нет прав на отклонение данного запросом",
				member: reactedMember, guildSettings
			});
			// Удалим реакцию пользователя
			return reaction.users.remove(reactedMember);
		}

		// Проверяем наличие канала для отправки сообщения
		const channel = message.guild.channels.cache
			.get(requestInfo.requested_channel) || null
		if (!channel) {
			// Отправим сообщение об ошибке
			sendErrorMessage({
				message, content: "ошибка при поиске канала отправки",
				member: reactedMember, guildSettings
			});
			// Удалим реакцию пользователя
			return reaction.users.remove(reactedMember);
		}

		// Отклоняем запрос
		message.channel.send(guildSettings.give_role.message_type == "plain_text" ?
			`**\`[Отклонение] \`${reactedMember}\` отклонил запрос пользователя \`${requestAuthor
			}\` с ником ${requestInfo.user.nick_info[0]}\`**` :
			new MessageEmbed()
				.setColor('#e34536')
				.setTitle("**❌ | Отклонение запроса**")
				.setDescription(`**${reactedMember} отклонил запрос пользователя ${requestAuthor
					} с ником \`${requestInfo.user.nick_info[0]}\`**`));
		requestInfo.remove();
		channel.send(guildSettings.give_role.message_type == "plain_text" ?
			`**\`[Отклонение] \`${requestAuthor}, ${reactedMember}\` отклонил ваш запрос на получение роли \`${requestAuthor
			}\` с ником ${requestInfo.user.nick_info[0]}\`**` :
			new MessageEmbed()
				.setColor('#e34536')
				.setTitle("**❌ | Отклонение запроса**")
				.setDescription(`**${requestAuthor}, ${reactedMember} отклонил ваш запрос на получение роли ${requestAuthor
					} с ником ${requestInfo.user.nick_info[0]}**`))
		return message.delete();
	}

	// Удаление запроса
	if (emoji.name == "🗑️") {
		// Если не было пользователя, написать об багнутом запросе
		if (!requestAuthor || !requestInfo || !tagInfo) {
			message.channel.send(guildSettings.give_role.message_type == "plain_text" ?
				`**\`[Удаление] \`${reactedMember}\` удалил багнутый запрос роли\`**` :
				new MessageEmbed()
					.setColor('#b4c1d6')
					.setTitle("**🗑️ | Удаление запроса**")
					.setDescription(`**${reactedMember} удалил багнутый запрос роли**`));

			// Если есть данные о запросе, поставить статус как удаленный
			if (requestInfo) requestInfo.remove();
			return message.delete();
		}

		// Проверим права автора реакции
		if (!reactedMember.hasPermission("MANAGE_ROLES") &&
			!reactedMember.roles.cache.some(role => tagInfo.manage_roles.includes(role.id))) {
			// Отправим сообщение об ошибке
			sendErrorMessage({
				message,
				content: "у вас нет прав на удаление данного запроса",
				member: reactedMember, guildSettings
			});
			// Удалим реакцию пользователя
			return reaction.users.remove(reactedMember);
		}

		// Удаляем запрос
		message.channel.send(guildSettings.give_role.message_type == "plain_text" ?
			`**\`[Удаление] \`${reactedMember}\` удалил запрос пользователя \`${requestAuthor
			}\` с ником ${requestInfo.user.nick_info[0]}\`**` :
			new MessageEmbed()
				.setColor('#b4c1d6')
				.setTitle("**🗑️ | Удаление запроса**")
				.setDescription(`**${reactedMember} удалил запрос пользователя ${requestAuthor
					} с ником \`${requestInfo.user.nick_info[0]}\`**`));
		requestInfo.remove();
		return message.delete();
	}
}

function sendErrorMessage({ message, content, member, guildSettings }) {
	message.channel.send(guildSettings.give_role.message_type == "plain_text" ?
		`**\`[Ошибка] \`${member}\`, ${content}\`**` :
		new MessageEmbed()
			.setColor('#ff3333')
			.setTitle("**🚫 | Произошла ошибка**")
			.setAuthor(member.displayName, member.user.displayAvatarURL())
			.setDescription(`**${member}, ${content}**`))
		.then(msg => setTimeout(() => msg.delete(), 8000));
}

function editRequestMessage({ message, guildSettings, member, rolesToGive, channel, whatChanged }) {
	message.edit(new MessageEmbed()
		.setColor(guildSettings.common.color)
		.setTitle("**📨 | Запрос роли**")
		.addFields(
			{ name: `**Пользователь**`, value: `**${member}**`, inline: true },
			{ name: `**Никнейм**`, value: `**${member.displayName ? member.displayName : "Не найдено"}**`, inline: true },
			{ name: `**Роли для выдачи**`, value: `**${rolesToGive || "Не найдено"}**`, inline: true },
			{ name: `**Канал отправки**`, value: `**${channel || "Удален"}**`, inline: true },
			{ name: "**Примечания**", value: "**```diff\n" + whatChanged.join("\n") + "```**" },
			{
				name: `**Информация по выдаче**`,
				value: "**`[✅] - выдать роль\n" +
					"[❌] - отказать в выдачи роли\n" +
					"[🔎] - проверить информацию\n" +
					"[🗑️] - удалить сообщение`**"
			},
		))
}