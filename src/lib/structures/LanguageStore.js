const Language = require("./Language");
const Store = require("./Base/Store");

class LanguageStore extends Store {
  constructor(client) {
    super(client, "languages", Language);
  }

  get default() {
    return this.get(this.client.language) || null;
  }
}

module.exports = LanguageStore;
