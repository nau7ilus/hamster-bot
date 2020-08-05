const Command = require("./Command");
const AliasStore = require("./Base/AliasStore");

class CommandStore extends AliasStore {
  constructor(client) {
    super(client, ["commands", "команд"], Command);
  }
}

module.exports = CommandStore;
