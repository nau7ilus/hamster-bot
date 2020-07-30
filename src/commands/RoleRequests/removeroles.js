const Command = require("lib/structures/Command");
// const { MessageEmbed } = require("discord.js");
const { sendErrorMessage } = require("lib/utils");

module.exports = new Command(
  {
    name: "removerole",
    description: "Снять роль",
    usage: "avatar <@упоминание | id>",
    aliases: ["removerole", "rr", "deleteroles", "deleterole", "dr"],
    guildOnly: true,
    userPermissions: "MANAGE_ROLES",
  },
  async (client, message, args, guildData) => {
    // Проверяем, включена ли система
    if (!guildData.give_roles.is_enabled) return;

    // Проверка упомянутого пользователя
    const member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if (!member) {
      return sendErrorMessage({
        message,
        member: message.member,
        content: `данный пользователь не был найден на сервере`,
        messageType: guildData.give_role.message_type,
      });
    }

    // const rolesToCheck = guildData.give_roles.tags.flatMap((tag) => tag.give_roles);
    // if (checkUserRoles(message.member, tagInfo.give_roles)) {
    //   console.log("132123132123");
    // }
  }
);

// function checkUserRoles(member, roles) {
//   const avaiableRoles = [];
//   roles.forEach((role) => {
//     if (member.roles.cache.some((r) => r.id == role)) {
//       avaiableRoles.push(role);
//     }
//   });
//   return avaiableRoles.length == roles.length;
// }
