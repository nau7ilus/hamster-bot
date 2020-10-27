'use strict';

const Guild = require('../../models/Guild');

exports.getGuildData = async (req, res) => {
  try {
    // Получение ID сервера
    const { guildId, action } = req.params;
    if (!guildId || !action) {
      res.code(400).send({ error: 'Не указан ID сервера для поиска или действие' });
      return;
    }

    // Дальше идет повторение кода. Можно добавить утилиту для этого
    // Поиск сервера в кеше бота
    const fetchedGuild = req.client.guilds.cache.get(guildId);
    if (!fetchedGuild) {
      res.code(400).send({ error: 'Бота нет на данном сервере' });
      return;
    }

    // Поиск пользователя на данном сервере
    const fetchedMember = fetchedGuild.members.cache.get(req.userData.id);
    if (!fetchedMember) {
      res.code(400).send({ error: 'Пользователя нет на сервере' });
      return;
    }

    // Проверка доступа пользователя к панели управления
    if (!fetchedMember.hasPermission('MANAGE_GUILD')) {
      res.code(403).send({ error: 'У пользователя нет прав просматривать данную страницу' });
      return;
    }

    // Поиск сервера в базе данных
    const guildSettings = await Guild.findOne({ id: guildId });
    if (!guildSettings) {
      res.code(404).send({ error: 'Сервер не найден в базе данных' });
      return;
    }

    const data = {
      common: guildSettings.common,
      'give-role': guildSettings.give_role,
    };

    res.send({ data: data[action] || null });
  } catch (err) {
    res.code(500).send(err);
  }
};

exports.changeGuildData = async (req, res) => {
  try {
    // Получение ID сервера
    const { guildId, action } = req.params;
    if (!guildId || !action) {
      res.code(400).send({ error: 'Не указан ID сервера для поиска или действие' });
      return;
    }

    // Проверка полученных данных для изменения
    const givenData = req.body;
    if (!givenData) {
      res.code(400).send({ error: 'Данные для изменения не указаны' });
      return;
    }

    // Дальше идет повторение кода. Можно добавить утилиту для этого
    // Поиск сервера в кеше бота
    const fetchedGuild = req.client.guilds.cache.get(guildId);
    if (!fetchedGuild) {
      res.code(400).send({ error: 'Бота нет на данном сервере' });
      return;
    }

    // Поиск пользователя на данном сервере
    const fetchedMember = fetchedGuild.members.cache.get(req.userData.id);
    if (!fetchedMember) {
      res.code(400).send({ error: 'Пользователя нет на сервере' });
      return;
    }

    // Проверка доступа пользователя к панели управления
    if (!fetchedMember.hasPermission('MANAGE_GUILD')) {
      res.code(403).send({ error: 'У пользователя нет прав просматривать данную страницу' });
      return;
    }

    // Поиск сервера в базе данных
    const guildSettings = await Guild.findOne({ id: guildId });
    if (!guildSettings) {
      res.code(404).send({ error: 'Сервер не найден в базе данных' });
      return;
    }

    // Нет такого типа данных в модели?
    if (!guildSettings[action]) {
      res.code(400).send({ error: 'Тип данных указан неверно' });
      return;
    }

    // Изменение данных
    for (let i in guildSettings[action].toJSON()) {
      if (givenData[i] !== guildSettings[action][i]) {
        guildSettings[action][i] = givenData[i];
      }
    }
    await guildSettings.save();

    // Возвращаем измененные данные
    res.send(guildSettings[action]);
  } catch (err) {
    res.code(500).send(err);
  }
};
