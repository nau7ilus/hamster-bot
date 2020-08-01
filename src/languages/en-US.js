const Language = require("lib/structures/Language");

module.exports = class extends Language {
  get phrases() {
    return {
      DEFAULT: (key) => `${key} has not been localized for en-US yet.`,
      DEFAULT_LANGUAGE: "Default Language",
    };
  }
};
