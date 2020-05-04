const { ShardingManager } = require('discord.js');
const Logger = require('./src/utils/Logger.js');
require('dotenv/config');

const manager = new ShardingManager('./src/index.js', {
    totalShards: 'auto',
    respawn: true,
    token: process.env.DISCORD_TOKEN
});
manager.spawn().then(() => {
    Logger.info(`Бот шардирован!`);
});