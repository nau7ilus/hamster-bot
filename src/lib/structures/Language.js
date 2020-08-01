const Piece = require("./Base/Piece");

class Language extends Piece {
  get(term, ...args) {
    if (!this.enabled && this !== this.store.default) return this.store.default.get(term, ...args);
    const phrase = this.phrases[term];
    switch (typeof phrase) {
      case "function":
        return phrase(...args);
      case "undefined":
        if (this === this.store.default) return this.phrases.DEFAULT(term);
        return `${this.phrases.DEFAULT(term)}\n\n**${
          this.phrases.DEFAULT_LANGUAGE
        }:**\n${this.store.default.get(term, ...args)}`;
      default:
        return phrase;
    }
  }
}

module.exports = Language;
