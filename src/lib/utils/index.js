const { MessageEmbed } = require("discord.js");
const { DateTime } = require("luxon");

/**
 * Получаем случайное значение из массива
 * @param {Array} array
 * @return {any} Рандомное значение из массива
 */
exports.random = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Отправка сообщения об ошибке
 * @param {Object} params Параметры функции
 * @param {Message} params.message
 * @param {string} params.content Текст ошибки
 * @param {GuildMember} params.member Пользователь
 * @param {guildData} params.guildData Настройки сервера в базе данных бота
 * @param {string} [params.emoji] Эмодзи
 * @param {boolean} [params.react=true] Ставить ли реакцию на сообщение
 * @param {(string|number)} [param.color=guildData.common.color] Цвет панели сообщения
 */
exports.sendErrorMessage = ({
  message,
  content,
  member,
  emoji,
  react = true,
  color,
  messageType = "embed",
}) => {
  if (!emoji) emoji = exports.random(["😥", "😔", "🤔", "⚠️", "⛔", "🚫"]);
  if (react) message.react(emoji);
  message.channel
    .send(
      messageType == "plain_text"
        ? `**\`[${emoji} | Ошибка] \`${member}\`, ${content}\`**`
        : new MessageEmbed()
            .setColor(color || "#ff3333")
            .setTitle(`**${emoji} | Произошла ошибка**`)
            .setDescription(`**${member}, ${content}**`)
            .setFooter("HamsterBot | Ошибка", message.guild.me.user.displayAvatarURL())
    )
    .then((msg) => setTimeout(() => msg.delete(), 60 * 1000));
};

/**
 * На случай ошибки при запуске системы/команды
 * @param {Object} params Параметры функции
 * @param {Client} client Бот
 * @param {Error} warning Объект ошибки
 * @param {Message} message Объект сообщения
 */
exports.onRunError = ({ client, warning, message }) => {
  console.warn(
    `[GiveRole] [Warn] Произошла ошибка в коде создания запроса Время: ${DateTime.local().toFormat(
      "TT"
    )}\nОшибка: ${warning.stack}`
  );

  // Если автор команды - разработчик, отправить информацию об ошибке, иначе просто факт
  if (client.isDev(message.author.id)) {
    // Если сообщение больше, чем 1024 символа (лимит в филде в ембеде), обрезать
    const messageToString =
      message.content.length > 1024 ? message.content.substring(0, 1021) + "..." : message.content;

    return message.channel.send(
      new MessageEmbed()
        .setColor("#ff3333")
        .setDescription(`**Произошла ошибка в коде системы**`)
        .addField(
          "**Отладка**",
          `**Автор: ${message.author} (\`${
            // prettier-ignore
            message.author.id
          }\`)\nСервер: **${message.guild.name}** (\`${
            // prettier-ignore
            message.guild.id
          }\`)\nВ канале: ${message.channel} (\`${message.channel.id})\`**`
        ) // prettier-ignore
        .addField("**Сообщение:**", messageToString)
        .addField(
          "**Ошибка**",
          warning.stack.length > 1024 ? warning.stack.substring(0, 1021) + "..." : warning.stack
        )
    );
  } else {
    return message.channel.send(
      new MessageEmbed()
        .setColor("#ff3333")
        .setTitle("**🚫 | Ошибка**")
        .setDescription("**Произошла ошибка в коде команды. Сообщите разработчикам об этом**")
    );
  }
};

/**
 * Проверить права бота в определенном канале
 * @param {TextChannel} channel Канал
 * @param {Array} permissions Список из названий прав, которые необходимо проверить
 * @param {GuildMember} member Пользователь
 * @return {Array} Список названий прав, которых нет у пользователя
 */
exports.checkPermissions = (channel, permissions, member) => {
  const missingPermissions = [];

  // Если у бота нет прав администратора на сервере, проверяем права для бота
  if (!member.hasPermission("ADMINISTRATOR")) {
    permissions.forEach((permission) => {
      if (!channel.permissionsFor(member).has(permission)) missingPermissions.push(permission);
    });
  }
  return missingPermissions;
};

/**
 * Перевод права на русский язык
 * @param {string} perm Название права на английском
 */
exports.localizePerm = (perm) => {
  const russianNames = {
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
    MENTION_EVERYONE: "Упомянуть всех",
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
    MANAGE_EMOJIS: "Управление эмодзи",
  };

  return russianNames[perm];
};

/**
 * Отправка сообщения о том, что нехватает прав
 * @param {Object} params Параметры функции
 * @param {Message} params.message Сообщение
 * @param {TextChannel} params.channel Текстовый канал
 * @param {Array} params.missingPerms Список недостающих прав
 * @param {string} [params.emoji="🔇"] Эмодзи в названии собщения
 * @param {boolean} [params.react=true] Ставить ли реакцию на сообщение
 */
exports.missingPermsError = ({
  message,
  channel,
  missingPerms,
  emoji = "🔇",
  react = true,
  isClient = true,
}) => {
  const canIgnore = message.channel.id !== channel.id;
  if (!missingPerms.includes("ADD_REACTIONS") || (canIgnore && !react)) message.react(emoji);
  if (!missingPerms.includes("SEND_MESSAGES") || canIgnore)
    return message.channel
      .send(
        !missingPerms.includes("EMBED_LINKS") || canIgnore
          ? new MessageEmbed()
              .setColor("#ff3333")
              .setTitle(`**${emoji} | Произошла ошибка**`)
              .setDescription(
                "**У " + isClient
                  ? "бота"
                  : "вас" +
                      " нехватает прав `" +
                      missingPerms.map((perm) => exports.localizePerm(perm)).join(", ") +
                      "` в канале <#" +
                      channel.id +
                      ">**"
              )
          : "**`[" +
              emoji +
              " | Ошибка] У бота нехватает прав '" +
              missingPerms.map((perm) => exports.localizePerm(perm)).join(", ") +
              "' в канале '" +
              channel.name +
              "'`**"
      )
      .then((msg) => setTimeout(() => msg.delete(), 25 * 1000));
};
