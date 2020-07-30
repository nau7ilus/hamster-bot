const { Collection } = require("discord.js");
const { join, extname, relative, sep } = require("path");
const { isClass } = require("lib/utils/Utils");
const fs = require("fs-nextra");

class Store extends Collection {
  constructor(client, name, holds) {
    super();
    this.client = client;
    this.name = name;
    this.holds = holds;
    this.pieceDirectories = new Set();
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
    this.pieceDirectories.forEach(async (directory) => await Store.walk(this, directory));
    return this.size;
  }

  load(directory, file) {
    const location = join(directory, ...file);
    let piece = null;
    try {
      const Piece = ((req) => req.default || req)(require(location));
      if (!isClass(Piece)) throw new TypeError("Файл не содержит класса");
      piece = this.set(new Piece(this, file, directory));
    } catch (error) {
      console.log(error);
    }
    delete require.cache[location];
    module.children.pop();
    return piece;
  }

  toString() {
    return this.name;
  }

  resolve(name) {
    if (name instanceof this.holds) return name;
    return this.get(name);
  }

  registerPieceDirectory(directory) {
    this.pieceDirectories.add(join(directory, this.name));
    return this;
  }

  static async walk(store, directory) {
    const files = await fs
      .scan(directory, { filter: (stats, path) => stats.isFile() && extname(path) === ".js" })
      .catch(console.log);
    if (!files) return true;

    return Promise.all(
      [...files.keys()].map((file) => store.load(directory, relative(directory, file).split(sep)))
    );
  }

  static get [Symbol.species]() {
    return Collection;
  }
}

module.exports = Store;
