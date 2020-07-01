// Импортируем модули сторонних разработчиков
const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");

// Импортируем загрузчики
const Loaders = require("../loaders/index");

// Экспортируем только созданный класс из обычного Client
module.exports = class AdvancedClient extends Client {
  constructor(token, devs = [], props) {
    super(props); // Если укажут дополнительные значения, используем их
    super.login(token); // Авторизовуемся, используя токен

    this.commands = new Collection(); // Список команд бота
    this.developers = devs; // ID разработчиков бота. Используется в командах с ограниченным доступом
    this.settings = null; // Настройки серверов (префиксы, системы). Устанавливается при подключение к БД

    console.log(`[Client] Начинается авторизация клиента`);
  }

  loadCommands(path) {
    console.log(`\n[Commands] Начинается загрузка команд`);

    const dirs = readdirSync(path);
    let total = 0;
    console.log(`[Commands] Категорий: ${dirs.length}`);

    for (let i in dirs) {
      const dir = dirs[i];
      const files = readdirSync(`${path}/${dir}`);

      if (dirs.length === 0) continue;
      console.log(`[Commands] Кол-во команд в папке ${dir}: ${files.length}`);

      for (let j in files) {
        const c = files[j];
        if (!c.endsWith(".js")) continue;

        this.loadCommand(`../modules/cmds/${dir}`, c);
        total++;
      }
    }
    console.log(`[Commands] Загружено команд: ${total}`);
    console.log(this.commands);
    return this;
  }

  loadCommand(path, name) {
    const command = require(`${path}/${name}`);
    if (command === undefined)
      throw new Error(
        `Название команды или ее путь указаны неверно\nПуть : ${path}\nНазвание:${name}`
      );
    this.commands.set(name, command);
    console.log(`[Commands] Загружается команда: ${name}`);
  }

  loadEvents(path) {
    console.log(`\n[Events] Начинается загрузка событий`);

    const files = readdirSync(path);
    let total = 0;
    console.log(`[Events] Событий: ${files.length}`);

    for (let file in files) {
      const eventFile = files[file];
      if (!eventFile.endsWith(".js")) continue;
      if (!eventFile)
        throw new Error(
          `Название события или его путь указаны неверно\nПуть : ${path}\nНазвание:${name}`
        );

      const event = require(`../modules/events/${eventFile}`);
      const eventName = eventFile.split(".")[0];
      this.on(eventName, event.bind(null, this));
      total++;

      console.log(`[Events] Загружается событие: ${eventName}`);
    }
    console.log(`[Events] Загружено событий: ${total}`);
    return this;
  }

  // Инициализация настроек
  async initializeLoaders() {
    for (let Loader in Loaders) {
      let loader = new Loaders[Loader](this);

      try {
        await loader.load();
      } catch (err) {
        console.error(err);
      }
    }
    return this;
  }

  // Является ли пользователь разработчиком
  isDev(id) {
    return this.developers.includes(id);
  }

  // Имеет ли бот определенное право на сервере
  hasPermission(message, permission) {
    return message.guild ? message.guild.me.hasPermission(permission, true, false, false) : false;
  }

  // Установка настроек бота
  setSettings(settings) {
    this.settings = settings;
    return this;
  }
};
