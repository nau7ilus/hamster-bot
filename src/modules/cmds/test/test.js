const Command = require("../../../structures/Command");

module.exports = new Command(
  {
    name: "test",
    description: "Тестовая команда",
    aliases: ["t"],
    devOnly: false,
    guildOnly: true,
    nsfw: false,
  },
  async (client, message) => {
    if (!["625036675059548220", "717206305374470155"].includes(message.guild.id)) return;

    message.channel.send(`иди нафиг`);
  }
);
