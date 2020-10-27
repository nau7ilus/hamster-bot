'use strict';

const { Structures, Message } = require('discord.js');

class AdvancedMessage extends Message {
  getLanguage(settings) {
    return this.guild
      ? this.guild.getLanguage(settings)
      : this.client.languages.get(this.client.languages.default.name) || null;
  }
}

module.exports = Structures.extend('Message', () => AdvancedMessage);
