const { Structures, Guild } = require("discord.js");
const GuildModel = require("../models/Guild");

class AdvancedGuild extends Guild {
  constructor(...args) {
    super(...args);

    this.settings = null;
    this.getSettings();
  }

  getSettings() {
    GuildModel.findOne({ id: this.id }).then((guild) => {
      console.log(guild.id);
      if (!guild) {
        GuildModel.create({ id: this.id }).then((data) => {
          this.settings = data;
        });
      } else this.settings = guild;
    });
  }

  get language() {
    const languageName = this.settings.common.language || this.client.languages.default.name;
    return this.client.languages.get(languageName) || null;
  }

  toJSON() {
    return { ...super.toJSON(), settings: this.settings.toJSON() };
  }
}

module.exports = Structures.extend("Guild", () => AdvancedGuild);
