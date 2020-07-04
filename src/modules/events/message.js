// Импортируем модули сторонних разработчиков
const { MessageEmbed } = require("discord.js"); // Используется для отправки сообщений типа Embed

// Импортируем собственные модули
const Guild = require("../../api/models/Guild");
const getCommand = require("../../utils/getThing");
const { onRunError } = require("../../utils");

// Экспортируем функцию. В параметрах client - бот, message - объект сообщения
module.exports = async (client, message) => {
  // Если это бот, выходим
  if (message.author.bot || message.system) return;

  // Проверяем на наличие сервера.
  // Так как, некоторые команды разрешено использовать в ЛС, необходимо проверить наличие сервера

  // Проверяем, находится ли сервер в базе данных. Если нет, создать его и обновить кэш
  if (message.guild && client.settings && !client.settings.find((g) => g.id == message.guild.id)) {
    await Guild.create({ id: message.guild.id });
    client.settings = await Guild.find({});
  }

  // Получаем настройки сервера, иначе null
  const guildSettings =
    message.guild && client.settings ? client.settings.find((g) => g.id == message.guild.id) : null;

  // Проверяем, включена ли система выдачи ролей
  if (
    guildSettings &&
    guildSettings.give_role.is_enabled &&
    guildSettings.give_role.trigger_words.length !== 0
  ) {
    // Создаем регулярное выражение, включая слова-триггеры для системы
    let systemTrigger = new RegExp(
      `^(?:${guildSettings.give_role.trigger_words.join("|")})$`,
      "gi"
    );
    if (systemTrigger.test(message.content)) {
      return require("../giveRoles/createRequest")
        .run({ message, guildSettings, client })
        .catch((warning) => onRunError({ client, warning, message }));
    }
  }

  // Получаем префикс бота из базы данных. По умолчанию '/'
  const thisPrefix = guildSettings ? guildSettings.common.prefix : "/";
  if (!message.content.startsWith(thisPrefix)) return; // Если сообщение не начинается с него, выходим

  // Заменяем массовые упоминания на обычный текст
  message.content = message.content.replace(/@everyone/g, "**everyone**");
  message.content = message.content.replace(/@here/g, "**here**");

  // Делим сообщение на аргументы, убирая пробелы между словами. Получаем массив
  const args = message.content.slice(thisPrefix.length).trim().split(/ +/g);

  // Находим команду в базе данных
  const cmd = await getCommand(client, "command", args[0].toLowerCase().normalize());
  args.shift(); // Удаляем первый элемент из массива (команду)

  // Если команда есть в БД
  if (cmd && !!thisPrefix) {
    // Если команда только для разработчиков, а у автора нет прав, дать ошибку
    if (!client.isDev(message.author.id) && (["dev"].includes(cmd.category) || cmd.devOnly)) {
      message.channel.send(
        new MessageEmbed()
          .setColor(guildSettings.common.color)
          .setTitle(`**У вас нет прав на использование этой команды**`)
      );

      return console.log(
        `[Message] ${message.author.tag} попытался использовать команду для разработчиков ${
          cmd.name
        } ${
          message.guild
            ? `на сервере ${message.guild.name} в канале ${message.channel.name}`
            : `в личных сообщениях`
        }`
      );
    }

    // Если нет сервера и команда была использована в ЛС
    if (!message.guild) {
      console.log(`[Message] ${message.author.tag} использовал команду ${cmd.name} в ЛС`);

      // Если команда требует использования на сервере, написать ошибку
      if (cmd.guildOnly) {
        message.channel.send(
          new MessageEmbed()
            .setColor(guildSettings.common.color)
            .setTitle(`**Эта команда доступна только на сервере**`)
        );

        return console.log(
          `[Message] ${message.author.tag} использовал команду ${cmd.name}. Ошибка: команда доступна только на сервере.`
        );
      }
    } else {
      // Логируем использование команды
      console.log(
        `[Message] ${message.author.tag} использовал команду ${cmd.name} ${
          message.guild
            ? `на сервере ${message.guild.name} в канале ${message.channel.name}`
            : `в личных сообщениях`
        }`
      );

      // Проверяем наличие прав у пользователя/бота
      const verified = verifyPerms(cmd);
      if (verified.client.length > 0)
        return message.channel.send(missingPermission(verified.client, true));
      if (verified.user.length > 0) return message.channel.send(missingPermission(verified.user));

      // Если команда требует NSFW у канала, а его нет, отправить ошибку
      if (cmd.nsfw && !message.channel.nsfw) {
        return message.channel.send(
          new MessageEmbed()
            .setColor("#ff3333")
            .setTitle("**🔞 | Ошибка**")
            .setDescription("**Эта команда доступна только в NSFW каналах**")
        );
      }
    }

    // Запускаем команду
    return cmd
      .run(client, message, args, guildSettings)
      .catch((warning) => onRunError({ warning, client, message }));
  }

  // Функция для проверки прав у пользователя/бота
  function verifyPerms(command) {
    // Создаем ссылку на метод
    const has = Object.prototype.hasOwnProperty;

    // Создаем два массива, куда будем вставлять необходимые права
    const clientMissingPermissions = [];
    const userMissingPermissions = [];

    // Если у бота нет прав администратора на сервере, проверяем права для бота
    if (!message.guild.me.hasPermission("ADMINISTRATOR")) {
      if (has.call(command, "clientPermissions")) {
        command.clientPermissions.forEach((permission) => {
          if (!message.guild.me.hasPermission(permission, true, false, false))
            clientMissingPermissions.push(permission);
        });
      }

      // Если необходимо проверить права пользователя, делаем это
      if (has.call(command, "userPermissions")) {
        command.userPermissions.forEach((permission) => {
          if (!message.member.hasPermission(permission, true, false, false))
            userMissingPermissions.push(permission);
        });
      }
    }
    return {
      client: clientMissingPermissions,
      user: userMissingPermissions,
    };
  }

  // Функция на отправку сообщения о нехватке прав
  function missingPermission(permissions, client = false) {
    return new MessageEmbed()
      .setColor(guildSettings.common.color)
      .setTitle(client ? `**У бота не хватает прав**` : `**У вас не хватает прав**`)
      .setDescription(`**Необходимо: ${permissions}**`);
  }
};
