const Command = require("../../../structures/Command");
const { MessageEmbed } = require("discord.js");
const emojis = ["🤨", "🧐", "🌚", "👁️", "🤖", "🥴", "👻", "👀", "😥", "😱"];
const variant = [
  "🧐 Я думаю, что лучше",
  "👻 Безупречно",
  "👻 100% вариант",
  "👍 Конечно",
  "👍 Бесспорно",
];
module.exports = new Command(
  {
    name: "select",
    description: "Выбрать что то из двух слов",
    usage: "select [слово] или [слово]",
    aliases: ["h"],
    devOnly: false,
    guildOnly: false,
  },
  async (client, message, args) => {
    function erremb(msg) {
      var random_emoji = Math.floor(Math.random() * emojis.length);
      let embed = new MessageEmbed() // !!!!
        .setColor(`#ecc333`)
        .setTitle(`${emojis[random_emoji]} | **Произошла ошибка**`)
        .setDescription(`${msg}`)
        .setFooter("HamsterBot | Ошибка");
      message.channel.send(embed);
    }

    let pred = Math.floor(Math.random() * variant.length);
    if (!args[0]) return erremb(`**Не указан текст**`);
    if (args[1] != "или")
      return erremb(`**Неправильная структура. Используйте selelct [слово] или [слово]**`);
    let num1 = args[0];
    let num2 = args[2];
    let sredn = Math.floor(Math.random() * 100);
    if (sredn == 0) {
      message.channel.send(
        new MessageEmbed()
          .setDescription(`Не могу опеределиться, попробуй еще разок 👀`)
          .setColor("RANDOM")
      );
    } else if (sredn > 50) {
      message.channel.send(
        new MessageEmbed().setDescription(`${variant[pred]} - **${num1}**`).setColor("RANDOM")
      );
    } else if (sredn < 50) {
      let pred = Math.floor(Math.random() * variant.length);
      message.channel.send(
        new MessageEmbed().setDescription(`${variant[pred]} - **${num2}**`).setColor("RANDOM")
      );
    }
  }
);
