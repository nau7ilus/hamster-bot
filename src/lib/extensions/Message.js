const { Structures, Message } = require("discord.js");

class AdvancedMessage extends Message {
  constructor(...args) {
    super(...args);
  }

  getLanguage(settings) {
    return this.guild
      ? this.guild.getLanguage(settings)
      : this.client.languages.get(this.client.languages.default.name) || null;
  }
}

module.exports = Structures.extend("Message", () => AdvancedMessage);
