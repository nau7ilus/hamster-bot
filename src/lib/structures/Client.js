const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");

const HTTPServer = require("./HTTPServer");
const Command = require("./Command");
const LanguageStore = require("./LanguageStore");

require("lib/extensions/Guild");

module.exports = class AdvancedClient extends Client {
  constructor(options) {
    super();
    // super.login(options.token);

    this.developers = options.devs;
    this.language = options.language || "ru";
    this.prefix = options.prefix || "/";
    this.commands = new Collection();

    this.pieceStores = new Collection();
    this.languages = new LanguageStore(this);

    this.registerStore(this.languages);

    const pieceDirectory = join(__dirname, "../../");
    for (const store of this.pieceStores.values()) store.registerPieceDirectory(pieceDirectory);

    console.log(`[Client] Начинается авторизация клиента`);
  }

  registerStore(store) {
    this.pieceStores.set(store.name, store);
    return this;
  }

  async login(token) {
    console.log("pieceStores", this.pieceStores);
    const loaded = await Promise.all(
      this.pieceStores.map(
        async (store) => `[Loader] Loaded ${await store.loadAll()} ${store.name}.`
      )
    ).catch((err) => {
      console.error(err);
      process.exit();
    });
    console.log(loaded.join("\n"));
  }

  //

  loadCommands() {
    console.log(`\n[Commands] Начинается загрузка команд`);
    let success = 0;
    let failed = 0;

    const dirs = readdirSync("./src/commands");
    console.log(`[Commands] Категорий: ${dirs.length}`);
    dirs.forEach((dir) => {
      const files = readdirSync(`./src/commands/${dir}`).filter((name) => name.endsWith(".js"));
      console.log(`\n[Commands] Кол-во команд в папке ${dir}: ${files.length}`);
      files.forEach((file) => (this._loadCommand(`commands/${dir}`, file) ? success++ : failed++));
    });

    if (failed)
      console.warn(`[Commands] Успешно загружено команд: ${success}, в ${failed} ошибка.`);
    else console.log(`[Commands] Успешно загружено команд: ${success}`);
    return this;
  }

  loadEvents() {
    console.log(`\n[Events] Начинается загрузка событий`);

    const files = readdirSync("./src/events").filter((name) => name.endsWith(".js"));
    let total = 0;

    files.forEach((file) => {
      const event = require(`events/${file}`);
      const eventName = file.split(".js")[0];
      this.on(eventName, event.bind(null, this));
      total++;

      console.log(`[Events] Событие ${eventName} успешно загружено`);
    });

    console.log(`[Events] Загружено событий: ${total}\n`);
    return this;
  }

  // Инициализация настроек
  async initializeHTTPServer() {
    const server = new HTTPServer(this);
    server.load();
    return this;
  }

  // Является ли пользователь разработчиком
  isDev(id) {
    return this.developers.includes(id);
  }

  _loadCommand(path, name) {
    const cmd = require(`${path}/${name}`);
    // Является ли командой?
    if (!(cmd instanceof Command)) {
      console.log(`[Commands] Ошибка загрузки файла ${name}. Не является командой`);
      return false;
    }

    // Соответствует ли название файла названию команды
    if (cmd.name !== name.split(".js")[0]) {
      console.log(
        `[Commands] Ошибка загрузки файла ${name}. Название команды несоответствует названию файла`
      );
      return false;
    }

    this.commands.set(name, cmd);
    console.log(`[Commands] Команда ${name} успешно загружена`);
    return true;
  }
};
