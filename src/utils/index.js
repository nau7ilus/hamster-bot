const { MessageEmbed } = require("discord.js");

exports.sendErrorMessage = ({ message, content, member, guildSettings }) => {
  message.channel
    .send(
      guildSettings.give_role.message_type == "plain_text"
        ? `**\`[Ошибка] \`${member}\`, ${content}\`**`
        : new MessageEmbed()
            .setColor("#ff3333")
            .setTitle("**🚫 | Произошла ошибка**")
            .setAuthor(member.displayName, member.user.displayAvatarURL())
            .setDescription(`**${member}, ${content}**`)
    )
    .then((msg) => setTimeout(() => msg.delete(), 8000));
};
