const Language = require("lib/structures/Language");

module.exports = class extends Language {
  get phrases() {
    return {
      DEFAULT: (key) => `${key} еще не переведен под русский язык.`,
      DEFAULT_LANGUAGE: "Язык по умолчанию",
    };
  }
};
