const { Client, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const Logger = require('../utils/Logger.js');
const Loaders = require('../loaders/index')
const chalk = require('chalk');

module.exports = class AdvancedClient extends Client {
    constructor(token, guilds, devs, props) {
        super(props);
        super.login(token)//.then(() => this.prefixes.push(`<@${this.user.id}>`));
        this.settings = null;
        this.commands = new Collection();
        this.developers = devs;
        Logger.comment('Авторизация клиента', 'loading');
    };

    loadCommands(path) {
        const dirs = readdirSync(path);
        let total = 0;
        Logger.info('Загрузка команд', 'loading');
        Logger.comment(`Категорий : (${dirs.length})`, 'loading');

        for (let i in dirs) {
            const dir = dirs[i];
            const files = readdirSync(`${path}/${dir}`);
            if (dirs.length === 0) continue;
            Logger.comment(`Команды в папке '${dir}' : (${files.length})`, 'loading');

            for (let j in files) {
                const c = files[j];
                if (!c.endsWith('.js')) continue;

                this.loadCommand(`../cmds/${dir}`, c);
                total++;
            }
        }
        Logger.info(`Загружено команд: ${total}`, 'loading');
        return this;
    }

    loadCommand(path, name) {
        const command = require(`${path}/${name}`);
        if (command === undefined) throw new Error(`Название команды или ее путь указаны неверно\nПуть : ${path}\nНазвание:${name}`);
        this.commands.set(name, command);
        Logger.comment(`Загружается команда : ${Logger.setColor('gold', name)}`, 'loading');
    }

    loadEvents(path) {
        const files = readdirSync(path);
        let total = 0;
        Logger.info('Загружаются события', 'loading');
        Logger.comment(`Событий : (${files.length})`, 'loading');

        for (let file in files) {
            const eventFile = files[file];
            if (!eventFile.endsWith('.js')) continue;
            if (!eventFile) throw new Error(`Название события или его путь указаны неверно\nПуть : ${path}\nНазвание:${name}`);
            const event = require(`../events/${eventFile}`);
            const eventName = eventFile.split('.')[0];
            this.on(eventName, event.bind(null, this));
            total++;
            Logger.comment(`Загружается событие : ${Logger.setColor('gold', `${eventName}.js`)}`, 'loading');
        }
        Logger.info(`Загружено событий: ${total}`, 'loading');
        return this;
    }

    isDev(id) {
        return this.developers.includes(id);
    }

    hasPermission(message, permission) {
        return message.guild ? message.guild.me.hasPermission(permission, true, false, false) : false;
    }

    setSettings(settings) {
        this.settings = settings;
        return this;
    }
    
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

    log(message, { tags, color = 'white' }) {
        console.log(...tags.map(t => chalk.cyan(`[${t}]`)), chalk[color](message));
    }

    logError(...args) {
        const tags = args.length > 1 ? args.slice(0, -1).map(t => `[${t}]`) : [];
        console.error('[Error]', ...tags, args[args.length - 1]);
    }
};