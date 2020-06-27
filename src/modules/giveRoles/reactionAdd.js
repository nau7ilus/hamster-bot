const { MessageEmbed } = require('discord.js');
const RoleRequests = require('../../structures/models/RoleRequests'); // Для логирования запросов
const diffUtils = require("../../utils/diff");

/**
 * TODO: При выходе пользователя с сервера, убирать все его заявки в БД
 */

exports.run = async (client, reaction, reactedUser, guildSettings) => {
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
    const requestAuthor = message.guild.members.cache.find(m =>
        `<@!${m.id}>` === message.embeds[0].fields[0].value.replace(/\*/g, '')) || null;

    // Ищем запрос в базе данных
    const requestInfo = await RoleRequests.findOne({
        "user.id": requestAuthor.id,
        "status": "poll",
        "guild_id": message.guild.id
    }).select("")

    // Найдем тег пользователя в настройках сервера
    const tagInfo = guildSettings.give_role.tags.find(tag =>
        tag.names.includes(requestInfo.user.nick_info[1])) || null;

    if (emoji.name == "✅") {
    }

    if (emoji.name == "❌") {
        // Если не было пользователя, написать об багнутом запросе
        if (!requestInfo || !tagInfo) {
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
                message, content: "у вас нет прав на отклонение данного запроса",
                member: reactedMember, guildSettings
            });
            // Удалим реакцию пользователя
            return reaction.users.remove(reactedMember);
        }

        /**
         * Проверка данных (переделать код)
         */
        // Создаем массив, куда будем отправлять информацию
        let whatChanged = message.embeds[0].fields[4].name == "**Примечания**" ?
            message.embeds[0].fields[4].value.split("```diff\n")[0].split("```")[1] || null : [];

        if (!requestAuthor && !whatChanged.includes("- Пользователь вышел с сервера")) {
            whatChanged.push("- Пользователь вышел с сервера");
        }

        if (requestAuthor && requestAuthor.displayName !== requestInfo.user.nick_info[0] &&
            !whatChanged.includes("- Пользователь сменил ник")) {
            // Проверяем форму ника. Создаем регулярное выражение по тому, что указано в БД
            let nickRegex = new RegExp(guildSettings.give_role.name_regexp, "i");
            // Создаем массив с информацией по нику пользователя
            let nickInfo = requestAuthor.displayName.match(nickRegex) || null;
            if (nickInfo) {
                nickInfo[3] = nickInfo[3] + '_' + nickInfo[4];
                nickInfo.splice(-1, 1);
            }
            requestInfo.user.nick_info = typeof nickInfo == 'array' ?
                nickInfo : [requestAuthor.displayName];
            requestInfo.save();
            whatChanged.push("- Пользователь сменил ник");
        }

        if (whatChanged.length > 0) {
            let rolesToGive = tagInfo.give_roles.map(r => `<@&${r}>`).join('\n');
            let channel = message.guild.channels.cache.get(requestInfo.requested_channel) || null;
            editRequestMessage({
                message, guildSettings, member: reactedMember,
                rolesToGive, channel, whatChanged
            });
            return reaction.users.remove(reactedMember);
        }
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
            if (requestInfo) {
                requestInfo.status = "deleted";
                requestInfo.save();
            }
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
            }\` с ником ${requestInfo.user.nick_info[0]} на время отправки\`**` :
            new MessageEmbed()
                .setColor('#b4c1d6')
                .setTitle("**🗑️ | Удаление запроса**")
                .setDescription(`**${reactedMember} удалил запрос пользователя ${requestAuthor
                    } с ником \`${requestInfo.user.nick_info[0]}\` на время отправки**`));
        requestInfo.status = "deleted";
        requestInfo.save();
        return message.delete();
    }
}

function sendErrorMessage({ message, content, member, guildSettings }) {
    message.channel.send(guildSettings.give_role.message_type == "plain_text" ?
        `**\`[Ошибка] \`${requestAuthor}\`, ${content}\`**` :
        new MessageEmbed()
            .setColor('#ff3333')
            .setTitle("**🚫 | Произошла ошибка**")
            .setAuthor(member.displayName, member.user.displayAvatarURL())
            .setDescription(`**${member}, ${content}**`))
        .then(msg => setTimeout(() => msg.delete(), 8000));
}

function editRequestMessage({ message, guildSettings, member, rolesToGive, channel, whatChanged }) {
    message.edit(new MessageEmbed()
        .setColor("#ff724f")
        .setTitle("**📨 | Запрос роли**")
        .setFooter(message.guild.name, message.guild.iconURL())
        .addFields(
            { name: "**Пользователь**", value: `**${member || "Нет на сервере"}**`, inline: true },
            { name: "**Никнейм**", value: `**${member.displayName || "Не найдено"}**`, inline: true },
            { name: "**Роли для выдачи**", value: `**${rolesToGive || "Не найдено"}**` },
            { name: "**Канал отправки**", value: `**${channel || "Удален"}**` },
            { name: "**Примечания**", value: "**```diff\n" + whatChanged + "```**" },
            { name: "**Информация по выдаче**", value: `**\`[✅] - выдать роль\n[❌] - отказать в выдачи роли\n[🗑️] - удалить сообщение\`**` },
        ))
}