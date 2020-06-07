const Command = require('../../../structures/Command');
const getThing = require('../../../utils/getThing');
const { MessageEmbed } = require('discord.js');

module.exports = new Command({
    name: 'help',
    description: 'Помощь по командам',
    usage: 'help <команда>',
    aliases: ['h'],
    devOnly: true,
    guildOnly: true
}, async (client, message, args) => {
    if (!['625036675059548220', '717206305374470155'].includes(message.guild.id)) return;

    console.log(client.commands)
    const embed = new MessageEmbed()
        .setColor('#beff33')
    let command;
    if (args[0]) {
        if (command = await getThing(client, 'command', args[0])) {

            embed
                .setTitle(`**📚 Информация по команде ${command.name}`)
                .setDescription(`Параметры: **<> - обязательные, [] - опционально**
Категория: **${command.category}**
Доступно в ЛС: **${command.guildOnly ? 'нет' : 'да'}**
${command.devOnly ? `**Доступно только для разработчиков**` : ''}`)
                .setColor('#beff33')
                .addField('Описание:', `**${command.description}**`);

            if (command.usage) {
                embed.addField('Использование:', `**${command.usage}**`)
            }
            if (command.userPermissions) {
                embed.addField('Необходимы права у пользователя:', `**${permsToRus(command.userPermissions).join(', ')}**`)
            }
            if (command.clientPermissions) {
                embed.addField('Необходимы права у бота:', `**${permsToRus(command.clientPermissions).join(', ')}**`)
            }
            if (command.aliases) {
                embed.addField('Также можно использовать:', `**${command.aliases.join(' ')}**`)
            }
        }
    } else {
        embed
            .setTitle('**📚┃Список команд**')
            .setDescription(`**Используйте /help <команда>, чтобы узнать больше информации о каждой команде отдельно
${client.commands.map(c => `**${c.name}** : ${c.description}`).join('\n\n')}**`);
    }
    return message.channel.send(embed);

    function permsToRus(perms) {
        let loc = {
            CREATE_INSTANT_INVITE: "Создавать приглашения",
            KICK_MEMBERS: "Кикать участников",
            BAN_MEMBERS: "Банить участников",
            ADMINISTRATOR: "Администратор",
            MANAGE_CHANNELS: "Управление каналами",
            MANAGE_GUILD: "Управление сервером",
            ADD_REACTIONS: "Добавлять реакции",
            VIEW_AUDIT_LOG: "Просмотр журнала аудита",

            VIEW_CHANNEL: "Читать сообщения",
            SEND_MESSAGES: "Отправлять сообщения",
            SEND_TTS_MESSAGES: "Отправлять TTS-сообщения",
            MANAGE_MESSAGES: "Управление сообщениями",
            EMBED_LINKS: "Встраивать ссылки",
            ATTACH_FILES: "Прикреплять файлы",
            READ_MESSAGE_HISTORY: "Читать историю сообщений",
            MENTION_EVERYONE: "Упоминуть всех",
            USE_EXTERNAL_EMOJIS: "Использовать внешние эмодзи",

            CONNECT: "Подключаться в голосовые",
            SPEAK: "Говорить в голосовых",
            MUTE_MEMBERS: "Отключать микрофон",
            DEAFEN_MEMBERS: "Отключать звук",
            MOVE_MEMBERS: "Перемещать участников",
            USE_VAD: "Приоритетный режим",

            CHANGE_NICKNAME: "Изменить ник",
            MANAGE_NICKNAMES: "Управление никнеймами",
            MANAGE_ROLES: "Управление ролями",
            MANAGE_WEBHOOKS: "Управление вебхуками",
            MANAGE_EMOJIS: "Управление эмодзи"
        }
        let ret = [];
        for (perm in perms) {
            ret.push(loc[perm])
        }
        return ret;
    }
});