const Logger = require('../utils/Logger.js');
const getCommand = require('../utils/getThing.js');
const { MessageEmbed } = require('discord.js');
const { DateTime } = require('luxon');

module.exports = async (client, message) => {

    function verifyPerms(command) {
        const clientMissingPermissions = [];
        const userMissingPermissions = [];
        if (!message.guild.me.hasPermission('ADMINISTRATOR')) {
            if (command.hasOwnProperty('clientPermissions')) {
                command.clientPermissions.forEach(permission => {
                    if (!message.guild.me.hasPermission(permission, true, false, false)) clientMissingPermissions.push(permission);
                });
            }
            if (command.hasOwnProperty('userPermissions')) {
                command.userPermissions.forEach(permission => {
                    if (!message.member.hasPermission(permission, true, false, false)) userMissingPermissions.push(permission);
                });
            }
        }

        return {
            client: clientMissingPermissions,
            user: userMissingPermissions
        };
    }

    function missingPermission(permissions, client = false) {
        return new MessageEmbed()
            .setColor('#ecc333')
            .setTitle(client ? `**У бота не хватает прав**` : `**У вас не хватает прав**`)
            .setDescription(`**Необходимо: ${permissions}**`);
    }

    if (message.author.bot || message.system) return;
    let prefix = '/';
    // const thisPrefix = client.prefixes[message.guild.id] || '/';

    message.content = message.content.replace(/@everyone/g, '**everyone**');
    message.content = message.content.replace(/@here/g, '**here**');

    const messageToString = message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);

    const cmd = await getCommand('command', args[0].toLowerCase().normalize());
    args.shift();
    if (message.content === prefix) {
        return message.channel.send(`**Текущие префиксы бота: ${thisPrefix}\n<@${client.user.id}>**`);
    }

    if (cmd && prefix !== false) {
        if (!client.isDev(message.author.id) && (['dev'].includes(cmd.category) || cmd.devOnly)) {

            message.channel.send(new MessageEmbed()
                .setColor('#ecc333')
                .setTitle(`**У вас нет прав на использование этой команды**`)
            );
            return Logger.log(`${
                Logger.setColor('magenta', message.author.tag)} попытался использовать команду для разработчиков ${
                Logger.setColor('gold', cmd.name)} на сервере ${
                Logger.setColor('teal', message.guild.name)
                }.`);
        }

        if (!message.guild) {
            Logger.log(`${
                Logger.setColor('magenta', message.author.tag)} использовал команду ${
                Logger.setColor('gold', cmd.name)} в ЛС.`
            );
            if (cmd.guildOnly) {
                message.channel.send(new MessageEmbed()
                    .setColor('#ecc333')
                    .setTitle(`**Эта команда доступна только на сервере**`));
                return Logger.log(`${
                    Logger.setColor('magenta', message.author.tag)} использовал команду ${
                    Logger.setColor('gold', cmd.name)} которая доступна только на сервере, но в ЛС`
                );
            }
        } else {
            Logger.log(`${
                Logger.setColor('magenta', message.author.tag)} использовал команду ${
                Logger.setColor('gold', cmd.name)} на сервере ${
                Logger.setColor('teal', message.guild.name)}.`
            );

            const verified = verifyPerms(cmd);
            if (verified.client.length > 0) return message.channel.send(missingPermission(verified.client, true));
            if (verified.user.length > 0) return message.channel.send(missingPermission(verified.user));

            if (cmd.nsfw && !message.channel.nsfw) {
               return message.channel.send(new MessageEmbed()
                .setColor('#ff3333')
                .setTitle('**🔞 | Ошибка**')
                .setDescription('**Эта команда доступна только в NSFW каналах**'));
            }
        }

        return cmd.run(client, message, args).catch((warning) => {
            Logger.warn(`Произошла ошибка в коде команды ${
                Logger.setColor('gold', cmd.name)}. \nВремя: ${
                Logger.setColor('yellow', DateTime.local().toFormat('TT'))}${
                Logger.setColor('red', '\nОшибка: ' + warning.stack)}`
            );


            if (client.isDev(message.author.id)) {
                return message.channel.send(new MessageEmbed()
                .setColor('#ff3333')
                .setDescription('**Произошла ошибка в коде команды: **' + cmd.name + '**')
                .addField('**Дебаг**', `**\nАвтор: ${message.author} (\`${message.author.id}\`)\n\nНа сервере: **${message.guild.name}** (\`${message.guild.id}\`)\n\nВ канале: ${message.channel} (\`${message.channel.id})\`**`)
                .addField('**Ошибка**', warning.stack.length > 1024 ? warning.stack.substring(0, 1021) + '...' : warning.stack)
                .addField('**Сообщение:**', messageToString));
            }
        });
    }
}