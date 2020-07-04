const Command = require("../../../structures/Command");
// const getThing = require("../../../utils/getThing");
// const { MessageEmbed } = require("discord.js");

module.exports = new Command(
  {
    name: "avatar",
    description: "Посмотреть аватар пользователя",
    usage: "avatar <@упоминание | id>",
    aliases: ["h"],
    devOnly: false,
    guildOnly: false,
  },
  async () => {
    // const sendAvatar = (member) => {
    //   message.channel.send(
    //     new MessageEmbed()
    //       .setColor(guildSettings.common.color)
    //       // .setAuthor(`${message.author.tag}`, `${message.guild.iconURL}`)
    //       .setDescription(`**Ваш аватар:**`)
    //       .setTimestamp()
    //       .setFooter(
    //         "HamsterBot | Аватар",
    //         client.user.displayAvatarURL({ dynamic: true, size: 4096 })
    //       )
    //       .setImage(message.author.displayAvatarURL({ dynamic: true, size: 4096 }))
    //   );
    // };
  }
);
