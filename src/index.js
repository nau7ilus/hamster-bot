const mongoose = require('mongoose');
const { readFileSync } = require('fs');
require('dotenv/config');
// const { createConnection } = require('mysql');

const Logger = require('./utils/Logger.js');
const Client = require('./structures/Client.js');
const Guild = require('./structures/models/Guild');

const LOCAL_DATA = {
    guilds: null,
    developers: [
        '422109629112254464', // Филипп (Nowman)
        '408740341135704065', // Андрей (Maikl Zhosan)
        '336207279412215809' // Артём (Kory)
    ]
}

Logger.logComments = true;
try {
    console.log(Logger.setColor('orange', readFileSync('./HamsterBot.txt').toString()));
} catch (e) {
    console.log(Logger.setColor('blue', 'Робохомячок'));
}

Logger.info(`Начало загрузки бота.`, 'loading');

const client = new Client(
    process.env.DISCORD_TOKEN, // Токен
    LOCAL_DATA.guilds, // Настройки для серверов
    LOCAL_DATA.developers); // Разработчики
module.exports = client;

client
    .loadCommands('./src/cmds/')
    .loadEvents('./src/events/')
    .initializeLoaders();

Logger.log('Конец загрузки бота.', 'loading');

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, async (err) => {
    if (err) throw err;
    Logger.info('База данных MONGO подключена');
    LOCAL_DATA.guilds = await Guild.find({});
    client.setSettings(LOCAL_DATA.guilds)
});

// const database = createConnection({
//     host: process.env.MYSQL_HOST,
//     user: process.env.MYSQL_USER,
//     password: process.env.MYSQL_PASSWORD,
//     database: process.env.MYSQL_DATABASE,
//     charset: 'utf8mb4'
// });

// database.connect(function(err) {
//     if (err) return process.exit(626);
//     Logger.info('База данных MYSQL подключена');
//     connection.query("SET SESSION wait_timeout = 604800"); // 3 дня
//     connection.query('SET NAMES utf8mb4')
// });

// module.exports = { };