// Импортируем модули сторонних разработчиков
const { MessageEmbed } = require('discord.js'); // Используется для отправки сообщений типа Embed
const { DateTime } = require('luxon'); // Форматирование времени

// Импортируем собственные модули
const Guild = require('../../structures/models/Guild');
const getCommand = require('../../utils/getThing');

// Экспортируем функцию. В параметрах client - бот, message - объект сообщения
module.exports = async (client, message) => {

    // Если это бот, выходим
    if (message.author.bot || message.system) return;

    // Проверяем на наличие сервера. 
    // Так как, некоторые команды разрешено использовать в ЛС, необходимо проверить наличие сервера

    // Проверяем, находится ли сервер в базе данных. Если нет, создать его и обновить кэш
    if (message.guild && client.settings && !client.settings.find(g => g.id == message.guild.id)) {
        await Guild.create({ id: message.guild.id })
        client.settings = await Guild.find({});
    }

    // Получаем настройки сервера, иначе null
    const guildSettings = message.guild && client.settings ? client.settings.find(g => g.id == message.guild.id) : null;

    // Проверяем, включена ли система выдачи ролей
    if (guildSettings && guildSettings.give_role.is_enabled &&
        guildSettings.give_role.trigger_words.length !== 0) {

        // Создаем регулярное выражение, включая слова-триггеры для системы
        let systemTrigger = new RegExp(`^(?:${guildSettings.give_role.trigger_words.join('|')})$`, "gi")
        if (systemTrigger.test(message.content)) {
            return require('../giveRoles/createRequest').run(message, guildSettings)
                .catch((warning) => {
                    console.warn(`[GiveRole] [Warn] Произошла ошибка в коде создания запроса Время: ${
                        DateTime.local().toFormat('TT')}\nОшибка: ${warning.stack}`)

                    // Если автор команды - разработчик, отправить информацию об ошибке, иначе просто факт
                    if (client.isDev(message.author.id)) {
                        return message.channel.send(new MessageEmbed()
                            .setColor('#ff3333')
                            .setDescription(`**Произошла ошибка в коде системы**`)
                            .addField('**Отладка**', `**Автор: ${message.author} (\`${message.author.id}\`)\nСервер: **${message.guild.name}** (\`${message.guild.id}\`)\nВ канале: ${message.channel} (\`${message.channel.id})\`**`)
                            .addField('**Сообщение:**', messageToString)
                            .addField('**Ошибка**', warning.stack.length > 1024 ? warning.stack.substring(0, 1021) + '...' : warning.stack));
                    } else {
                        return message.channel.send(new MessageEmbed()
                            .setColor('#ff3333')
                            .setTitle('**🚫 | Ошибка**')
                            .setDescription('**Произошла ошибка в коде команды. Сообщите разработчикам об этом**'));
                    }
                });
        }
    }

    // Получаем префикс бота из базы данных. По умолчанию '/'
    const thisPrefix = guildSettings ? guildSettings.common.prefix : '/';
    if (!message.content.startsWith(thisPrefix)) return; // Если сообщение не начинается с него, выходим

    // Заменяем массовые упоминания на обычный текст
    message.content = message.content.replace(/@everyone/g, '**everyone**');
    message.content = message.content.replace(/@here/g, '**here**');

    // На случай, если сообщение очень большое, заменим конец на 3 точки
    const messageToString = message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content;
    const args = message.content.slice(thisPrefix.length).trim().split(/ +/g); // Получаем аргументы команды

    // Находим команду в базе данных
    const cmd = await getCommand(client, 'command', args[0].toLowerCase().normalize());
    args.shift(); // Удаляем первый элемент из массива (команду)

    // Если команда есть в БД
    if (cmd && !!thisPrefix) {

        // Если команда только для разработчиков, а у автора нет прав, дать ошибку
        if (!client.isDev(message.author.id) && (['dev'].includes(cmd.category) || cmd.devOnly)) {

            message.channel.send(new MessageEmbed()
                .setColor(guildSettings.common.color)
                .setTitle(`**У вас нет прав на использование этой команды**`)
            );

            return console.log(`[Message] ${message.author.tag} попытался использовать команду для разработчиков ${
                cmd.name} ${message.guild ? `на сервере ${message.guild.name} в канале ${
                    message.channel.name}` : `в личных сообщениях`}`)
        }

        // Если нет сервера и команда была использована в ЛС
        if (!message.guild) {
            console.log(`[Message] ${message.author.tag} использовал команду ${cmd.name} в ЛС`)

            // Если команда требует использования на сервере, написать ошибку
            if (cmd.guildOnly) {
                message.channel.send(new MessageEmbed()
                    .setColor(guildSettings.common.color)
                    .setTitle(`**Эта команда доступна только на сервере**`));

                return console.log(`[Message] ${message.author.tag} использовал команду ${
                    cmd.name}. Ошибка: команда доступна только на сервере.
                    }`)
            }
        } else {

            // Логируем использование команды
            console.log(`[Message] ${message.author.tag} использовал команду ${
                cmd.name} ${message.guild ? `на сервере ${message.guild.name} в канале ${
                    message.channel.name}` : `в личных сообщениях`}`)

            // Проверяем наличие прав у пользователя/бота
            const verified = verifyPerms(cmd);
            if (verified.client.length > 0) return message.channel.send(missingPermission(verified.client, true));
            if (verified.user.length > 0) return message.channel.send(missingPermission(verified.user));

            // Если команда требует NSFW у канала, а его нет, отправить ошибку
            if (cmd.nsfw && !message.channel.nsfw) {
                return message.channel.send(new MessageEmbed()
                    .setColor('#ff3333')
                    .setTitle('**🔞 | Ошибка**')
                    .setDescription('**Эта команда доступна только в NSFW каналах**'));
            }
        }

        // Запускаем команду
        return cmd.run(client, message, args)

            // Если есть ошибка в коде, отправить сообщение в канал разработчиков
            .catch((warning) => {
                console.warn(`[Message] [Warn] Произошла ошибка в коде команды ${cmd.name
                    } Время: ${DateTime.local().toFormat('TT')}\nОшибка: ${warning.stack}`)

                // Если автор команды - разработчик, отправить информацию об ошибке, иначе просто факт
                if (client.isDev(message.author.id)) {
                    return message.channel.send(new MessageEmbed()
                        .setColor('#ff3333')
                        .setDescription(`**Произошла ошибка в коде команды: \`${cmd.name}\`**`)
                        .addField('**Отладка**', `**Автор: ${message.author} (\`${message.author.id}\`)\nСервер: **${message.guild.name}** (\`${message.guild.id}\`)\nВ канале: ${message.channel} (\`${message.channel.id})\`**`)
                        .addField('**Сообщение:**', messageToString)
                        .addField('**Ошибка**', warning.stack.length > 1024 ? warning.stack.substring(0, 1021) + '...' : warning.stack));
                } else {
                    return message.channel.send(new MessageEmbed()
                        .setColor('#ff3333')
                        .setTitle('**🚫 | Ошибка**')
                        .setDescription('**Произошла ошибка в коде команды. Сообщите разработчикам об этом**'));
                }
            });
    }

    // Функция для проверки прав у пользователя/бота
    function verifyPerms(command) {

        // Создаем два массива, куда будем вставлять необходимые права
        const clientMissingPermissions = [];
        const userMissingPermissions = [];

        // Если у бота нет прав администратора на сервере, проверяем права для бота
        if (!message.guild.me.hasPermission('ADMINISTRATOR')) {
            if (command.hasOwnProperty('clientPermissions')) {
                command.clientPermissions.forEach(permission => {
                    if (!message.guild.me.hasPermission(permission, true, false, false)) clientMissingPermissions.push(permission);
                });
            }

            // Если необходимо проверить права пользователя, делаем это
            if (command.hasOwnProperty('userPermissions')) {
                command.userPermissions.forEach(permission => {
                    if (!message.member.hasPermission(permission, true, false, false)) userMissingPermissions.push(permission);
                });
            }
        }

        // Возвращаем 2 массива
        return {
            client: clientMissingPermissions,
            user: userMissingPermissions
        };
    }

    // Функция на отправку сообщения о нехватке прав
    function missingPermission(permissions, client = false) {
        return new MessageEmbed()
            .setColor(guildSettings.common.color)
            .setTitle(client ? `**У бота не хватает прав**` : `**У вас не хватает прав**`)
            .setDescription(`**Необходимо: ${permissions}**`);
    }
}