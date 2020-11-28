'use strict';

const { MessageEmbed } = require('discord.js');
const plural = require('plural-ru');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');

const numbers = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'removerole',
      aliases: ['rr'],
    });
  }
  // eslint-disable-next-line consistent-return
  async run({ message, guildData, args }) {
    const mentionedMember = message.mentions.members.first()
      ? message.mentions.members.first()
      : args[0] && this.ifSnowflake(args[0])
      ? await message.guild.members.fetch(args[0])
      : null;

    if (!mentionedMember) {
      return sendErrorMessage({
        message,
        content: 'вы не указали пользователя: ```/removerole <user|userID>```',
        member: message.member,
      });
    }

    const guildTags = guildData.give_role.tags;
    const rolesToRemove = guildTags.filter(t => mentionedMember.roles.cache.some(r => t.give_roles.includes(r.id)));

    const rolesCanRemove = rolesToRemove.filter(
      t =>
        message.member.hasPermission('MANAGE_ROLES') ||
        message.member.roles.cache.some(r => t.manage_roles.includes(r.id)),
    );

    if (rolesToRemove.length === 0) {
      message.react('⚠️');
      return message.channel
        .send(
          message.member,
          new MessageEmbed()
            .setColor(0xfcba03)
            .setTitle('**⚠️ ┃ Ошибка при выполнении**')
            .setDescription(`**У пользователя ${mentionedMember} нет ролей, которые можно снять**`)
            .setTimestamp(),
        )
        .then(msg => msg.delete({ timeout: 15000 }));
    } else if (rolesCanRemove.length > 1) {
      this.selectRoles(message, mentionedMember, rolesCanRemove);
    } else {
      this.removeRoles(
        message,
        message.member,
        mentionedMember,
        Array.from(new Set(rolesCanRemove.flatMap(t => t.give_roles))),
      );
    }
  }

  getRoleNames(guild, roles) {
    const roleNames = [];
    roles.forEach(roleID => roleNames.push(guild.roles.cache.get(roleID).name || 'Не найдено'));
    return roleNames;
  }

  createRolesList(guild, roles) {
    const list = [];
    roles.forEach((role, i) => {
      const isSelected = roles.find(r => r.id === -1).isSelected || role.isSelected;
      const roleName = role.id === -1 ? 'Выбрать все роли\n' : guild.roles.cache.get(role.id).name;
      list.push(`${isSelected ? '- ' : ''}[${i}] ${roleName}`);
    });
    return list.join('\n');
  }

  createRolesArray(roles) {
    const arr = [];
    arr.push({ id: -1, isSelected: false });
    roles.forEach(id => arr.push({ id, isSelected: false }));
    return arr;
  }

  createSelectMenu(roles, member, guild, error) {
    const FOUNDED_ROLES = key => plural(key, '%d роль', '%d роли', '%d ролей');
    return new MessageEmbed()
      .setColor(0x03c2fc)
      .setTitle('**🔎 ┃ Снятие ролей**')
      .setFooter('На выбор у вас есть 1 минута')
      .setTimestamp()
      .setDescription(
        `**Найдено ${FOUNDED_ROLES(roles.length - 1)}, которые вы можете снять пользователю ${member}**` +
          `\n**\`\`\`diff\n${this.createRolesList(guild, roles.slice(0, 11))}\`\`\`${
            error ? `\n\`\`\`diff\n- ${error}\`\`\`` : ''
          }${
            roles.length - 1 > 10
              ? '\nМне было лень продумать вариант, если ролей больше 10. Надо было бы вторую страницу делать, ' +
                'что мне в падлу. Так что, пожалуйста, выбери просто все роли'
              : ''
          }**`,
      );
  }

  async selectRoles(message, member, tags) {
    const rolesArray = this.createRolesArray(Array.from(new Set(tags.flatMap(t => t.give_roles))));
    const msg = await message.channel.send(message.member, this.createSelectMenu(rolesArray, member, message.guild));

    for (const [i] of rolesArray.slice(0, 11).entries()) {
      msg.react(numbers[i]);
    }
    msg.react('🆗');

    const filter = reaction => reaction.emoji.name === '🆗' || numbers.includes(reaction.emoji.name);
    const collector = msg.createReactionCollector(filter, { time: 60000 });

    collector.on('collect', (reaction, user) => {
      if (user.bot) return;
      if (user.id !== message.author.id) {
        // eslint-disable-next-line consistent-return
        return reaction.users.remove(user);
      }

      if (numbers.includes(reaction.emoji.name)) {
        reaction.users.remove(user);

        const elementIndex = numbers.indexOf(reaction.emoji.name);
        if (elementIndex === 0) {
          if (rolesArray[0].isSelected) {
            rolesArray.forEach(r => (r.isSelected = false));
          } else {
            rolesArray.forEach(r => (r.isSelected = true));
          }
        } else {
          rolesArray[elementIndex].isSelected = !rolesArray[elementIndex].isSelected;

          if (rolesArray.slice(1, 10).every(r => r.isSelected)) {
            rolesArray[0].isSelected = true;
          } else {
            rolesArray[0].isSelected = false;
          }
        }

        msg.edit(message.member, this.createSelectMenu(rolesArray, member, message.guild));
      } else if (reaction.emoji.name === '🆗') {
        if (!rolesArray.find(r => r.isSelected)) {
          msg.edit(
            message.member,
            this.createSelectMenu(rolesArray, member, message.guild, 'Вы не выбрали ни одной роли'),
          );
          // eslint-disable-next-line consistent-return
          return reaction.users.remove(user);
        }
        msg.reactions.removeAll();
        msg.edit(message.member, new MessageEmbed().setColor(0x2f3136).setTitle('**Загрузка...**'));
        this.removeRoles(
          msg,
          message.member,
          member,
          rolesArray.filter(r => r.isSelected && r.id !== -1).map(r => r.id),
          true,
        );
      } else {
        reaction.users.remove(user);
      }
    });
  }

  async removeRoles(message, author, member, rolesToRemove, editMsg = false) {
    const successRoles = [];
    const ejectedRoles = [];

    for await (const roleID of rolesToRemove) {
      try {
        await member.roles.remove(roleID);
        successRoles.push(roleID);
      } catch (err) {
        ejectedRoles.push(roleID);
      }
    }

    this.sendResults(message, author, member, { successRoles, ejectedRoles }, editMsg);
  }

  sendResults(message, author, member, results, editMsg = false) {
    const { successRoles, ejectedRoles } = results;

    const embedContent = [];
    const counts = [
      plural(successRoles.length, '%d роль', '%d роли', '%d ролей'),
      plural(ejectedRoles.length, '%d роль', '%d роли', '%d ролей'),
    ];

    if (ejectedRoles.length === 0) {
      embedContent.push(
        `Вы успешно сняли ${counts[0]} (${successRoles.map(r => `<@&${r}>`).join(', ')}) пользователю ${member}`,
      );
    } else {
      embedContent.push(
        `Снято успешно: ${counts[0]} ${successRoles.length === 0 ? ':' : ''} ${successRoles
          .map(r => `<@&${r}>`)
          .join(', ')}`,
      );
      embedContent.push(
        `Не удалось ${counts[1]} ${ejectedRoles.length === 0 ? ':' : ''} ${ejectedRoles
          .map(r => `<@&${r}>`)
          .join(', ')}`,
      );
    }

    const embed = new MessageEmbed()
      .setColor(ejectedRoles.length ? 0xfc4a03 : 0x03fc66)
      .setTitle(`**${ejectedRoles.length ? '🤔' : '✅'} ┃ Снятие ролей**`)
      .setDescription(`**${embedContent.join('\n')}**`)
      .setTimestamp();

    if (editMsg) {
      message.edit(author, embed);
    } else {
      message.channel.send(author, embed);
    }
  }

  ifSnowflake(str) {
    return str.length === 18 && !isNaN(+str);
  }
};
