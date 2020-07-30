module.exports = async (client, reaction, reactedUser) => {
  // Если автор бот - выходим
  if (reactedUser.bot) return;

  // Получаем сообщение, пользователей и эмодзи
  const { message } = reaction;

  if (message.guild.id === "625036675059548220") {
    if (message.channel.id !== "685637641487777918") return;
    if (message.author.id !== client.user.id) return;
    if (reaction.emoji.name === "📯") {
      const roleToGive = message.guild.roles.cache.get("685688643847061525");
      const userForRole = message.guild.members.cache.get(reactedUser.id);
      userForRole.roles.remove(roleToGive);
    }
    if (reaction.emoji.name === "🙋") {
      const roleToGive = message.guild.roles.cache.get("625318204071215151");
      const userForRole = message.guild.members.cache.get(reactedUser.id);
      userForRole.roles.remove(roleToGive);
    }
  }
};
