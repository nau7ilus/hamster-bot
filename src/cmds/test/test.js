const Command = require('../../structures/Command');

module.exports = new Command({
    name: 'test',
    description: 'Тестовая команда',
    aliases: ['t'],
    devOnly: true,
    guildOnly: true,
    nsfw: true,
}, async (client, message) => {
    console.log(JSON.stringify(client.settings))
    message.channel.send(JSON.stringify(client.settings));
});