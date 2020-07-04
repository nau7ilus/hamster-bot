const Command = require("../../../structures/Command");
const { MessageEmbed } = require("discord.js");

function ReverseString(str) {
  return str.split("").reverse().join("");
}

module.exports = new Command(
  {
    name: "reverse",
    description: "Перевернуть текст",
    usage: "reverse [text]",
    aliases: ["h"],
    devOnly: false,
    guildOnly: false,
  },
  async (client, message, args) => {
    if (!args[0]) {
      message.channel.send(
        new MessageEmbed()
          .setColor(`#ecc333`)
          .setDescription(`**Не указан текст**`)
          .setTimestamp()
          .setFooter(
            "HamsterBot | Переворот текста",
            client.user.displayAvatarURL({ dynamic: true, size: 4096 })
          )
      );
      return;
    }
    let text = args.slice(0).join(" ");
    let gtext = ReverseString(text);
    message.channel.send(new MessageEmbed().setDescription(`${gtext}`).setColor(`#ecc333`));
    return;
  }
);
