const { ShardingManager } = require('discord.js');
const Logger = require('./src/utils/Logger.js');
const { get } = require("http");
require('dotenv/config');

const manager = new ShardingManager('./src/index.js', {
    totalShards: 'auto',
    respawn: true,
    token: process.env.DISCORD_TOKEN
});
manager.spawn().then(() => {
    Logger.info(`Бот шардирован!`);
});

setInterval(() => {
    get("http://web-robo-hamster.herokuapp.com");
}, 5 * 60 * 1000);
