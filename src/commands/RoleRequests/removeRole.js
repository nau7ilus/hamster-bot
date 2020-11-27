'use strict';

const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'removerole',
      aliases: ['rr'],
    });
  }
  async run({ message, guildData, args }) {
    const mentionedMember = message.mentions.members.first()
      ? message.mentions.members.first()
      : args[0] && this.ifSnowflake(args[0])
      ? await message.guild.members.fetch(args[0])
      : null;

    if (!mentionedMember) {
      return sendErrorMessage({
        message,
        content: 'вы не указали пользователя: ```/removerole <user|userID> <reason>```',
        member: message.member,
      });
    }

    // Проверка наличия причины
    // ...

    const guildTags = guildData.give_role.tags;
    const rolesList = guildTags.flatMap(t => t.give_roles);
    const rolesSet = new Set(rolesList);

    const rolesToRemove = guildTags.filter(t => mentionedMember.roles.cache.some(r => t.give_roles.includes(r.id)));
    console.log(rolesToRemove);

    // if (mentionedMember.roles.cache.roles.filter(r => )) {}
    // }
  }

  ifSnowflake(str) {
    return str.length === 18 && !isNaN(+str);
  }

  getRolesSet(guildData) {
    const roles = [];
    for (const tag of guildData.give_role.tags.entries()) {
      const tagRole = tag.give_roles;
    }
  }
};
