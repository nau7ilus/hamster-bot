const { Collection } = require("discord.js");
const { join } = require("path");
const { readSync } = require("readdir");

const { isClass } = require("lib/utils/Utils");

class Store extends Collection {
  constructor(client, names, holds) {
    super();
    this.client = client;
    this.names = names; // [eng, rus]
    this.holds = holds;
    this.directories = new Set();
  }

  set(piece) {
    if (!(piece instanceof this.holds))
      throw new TypeError(`В этом магазине могут быть сохранены только ${this}`);
    const existing = this.get(piece.name);
    if (existing) this.delete(existing);
    super.set(piece.name, piece);
    return piece;
  }

  delete(name) {
    const piece = this.resolve(name);
    if (!piece) return false;
    super.delete(piece.name);
    return true;
  }

  loadAll() {
    this.clear();
    this.directories.forEach(async (directory) => await Store.walk(this, directory));
    return this.size;
  }

  load(directory, file) {
    const fileLocation = join(directory, file);
    let storedPiece = null;
    try {
      const Piece = require(fileLocation);
      if (!isClass(Piece)) throw new TypeError(`Файл ${file} не содержит класса`);
      storedPiece = this.set(new Piece(this, file, directory));
    } catch (err) {
      console.log(err);
    }
    return storedPiece;
  }

  toString() {
    return this.name;
  }

  resolve(name) {
    if (name instanceof this.holds) return name;
    return this.get(name);
  }

  registerPieceDirectory(directory) {
    this.directories.add(join(directory, this.names[0]));
    return this;
  }

  static async walk(store, directory) {
    const files = readSync(directory, ["**.js"]);
    return files ? files.map((file) => store.load(directory, file)) : true;
  }
}

module.exports = Store;
