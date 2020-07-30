const { pathExists } = require("fs-nextra");
const { join } = require("path");
const { mergeDefault, isClass } = require("lib/utils/Utils");
const LanguageStore = require("./LanguageStore");
const Piece = require("./Base/Piece");

class Language extends Piece {
  // get(term, ...args) {
  //   if (!this.enabled) {
  //   }

  async init() {
    for (const piece in this.store.pieceDirectories) {
      const location = join(piece, ...this.file);
      if (this.dir !== piece && (await pathExists(location))) {
        try {
          const CorePiece = ((req) => req.default || req)(require(location));
          if (!isClass(CorePiece)) return;
          const coreLang = new CorePiece(this.store, this.file, piece);
          this.language = mergeDefault(coreLang.language, this.language);
        } catch (error) {
          return;
        }
      }
    }
  }
}

module.exports = Language;
