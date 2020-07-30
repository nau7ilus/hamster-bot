const { Structures } = require("discord.js");
const GuildModel = require("../models/Guild");

module.exports = Structures.extend("Guild", (Guild) => {
  class AdvancedGuild extends Guild {
    constructor(...args) {
      super(...args);
      GuildModel.findOne({ id: this.id }).then((guild) => {
        this.settings = guild ? guild : null;
      });
    }

    get language() {
      const f = this.client.languages.get(this.settings.common.language) || null;
      console.log(f);
      return f;
    }

    toJSON() {
      return { ...super.toJSON(), settings: this.settings.toJSON() };
    }
  }

  return AdvancedGuild;
});
