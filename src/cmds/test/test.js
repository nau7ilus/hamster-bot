const Command = require('../../structures/Command');

module.exports = new Command({
    name: 'test',
    description: 'Тестовая команда',
    aliases: ['t'],
    devOnly: true,
    guildOnly: true,
    nsfw: false,
}, async (client, message) => {
    message.channel.send(`иди нафиг`);
});