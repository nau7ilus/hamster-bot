const Guild = require("lib/models/Guild");

exports.getGuildData = async (req, res) => {
  try {
    // Получение ID сервера
    const { guildId, action } = req.params;
    if (!guildId || !action)
      return res.code(400).send({ error: "Не указан ID сервера для поиска или действие" });

    // Дальше идет повторение кода. Можно добавить утилиту для этого
    // Поиск сервера в кеше бота
    const fetchedGuild = req.client.guilds.cache.get(guildId);
    if (!fetchedGuild) return res.code(400).send({ error: "Бота нет на данном сервере" });

    // Поиск пользователя на данном сервере
    const fetchedMember = fetchedGuild.members.cache.get(req.userData.id);
    if (!fetchedMember) return res.code(400).send({ error: "Пользователя нет на сервере" });

    // Проверка доступа пользователя к панели управления
    if (!fetchedMember.hasPermission("MANAGE_GUILD"))
      return res.code(403).send({ error: "У пользователя нет прав просматривать данную страницу" });

    // Поиск сервера в базе данных
    const guildSettings = await Guild.findOne({ id: guildId });
    if (!guildSettings) return res.code(404).send({ error: "Сервер не найден в базе данных" });

    const data = {
      common: guildSettings.common,
      "give-role": guildSettings.give_role,
    };

    return { data: data[action] || null };
  } catch (err) {
    return err;
  }
};

exports.changeGuildData = async (req, res) => {
  try {
    // Получение ID сервера
    const { guildId, action } = req.params;
    if (!guildId || !action)
      return res.code(400).send({ error: "Не указан ID сервера для поиска или действие" });

    // Проверка полученных данных для изменения
    const givenData = req.body;
    if (!givenData) return res.code(400).send({ error: "Данные для изменения не указаны" });

    // Дальше идет повторение кода. Можно добавить утилиту для этого
    // Поиск сервера в кеше бота
    const fetchedGuild = req.client.guilds.cache.get(guildId);
    if (!fetchedGuild) return res.code(400).send({ error: "Бота нет на данном сервере" });

    // Поиск пользователя на данном сервере
    const fetchedMember = fetchedGuild.members.cache.get(req.userData.id);
    if (!fetchedMember) return res.code(400).send({ error: "Пользователя нет на сервере" });

    // Проверка доступа пользователя к панели управления
    if (!fetchedMember.hasPermission("MANAGE_GUILD"))
      return res.code(403).send({ error: "У пользователя нет прав просматривать данную страницу" });

    // Поиск сервера в базе данных
    const guildSettings = await Guild.findOne({ id: guildId });
    if (!guildSettings) return res.code(404).send({ error: "Сервер не найден в базе данных" });

    // Нет такого типа данных в модели?
    if (!guildSettings[action]) return res.code(400).send({ error: "Тип данных указан неверно" });

    // Изменение данных
    for (let i in guildSettings[action].toJSON()) {
      if (givenData[i] !== guildSettings[action][i]) {
        guildSettings[action][i] = givenData[i];
      }
    }
    await guildSettings.save();

    // Возвращаем измененные данные
    return guildSettings[action];
  } catch (err) {
    return err;
  }
};
