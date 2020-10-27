'use strict';

const { Structures, Guild } = require('discord.js');

class AdvancedGuild extends Guild {
  getLanguage(settings) {
    const languageName =
      (settings && settings.common ? settings.common.language : null) || this.client.languages.default.name;
    return this.client.languages.get(languageName) || null;
  }
}

module.exports = Structures.extend('Guild', () => AdvancedGuild);
