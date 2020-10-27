'use strict';

class Util {
  static isClass(input) {
    return (
      typeof input === 'function' &&
      typeof input.prototype === 'object' &&
      input.toString().substring(0, 5) === 'class'
    );
  }

  static isObject(input) {
    return input && input.constructor === Object;
  }

  static deepClone(source) {
    if (source === null || Util.isPrimitive(source)) return source;
    if (Array.isArray(source)) {
      const output = [];
      for (const value of source) output.push(Util.deepClone(value));
      return output;
    }
    if (Util.isObject(source)) {
      const output = {};
      for (const [key, value] of Object.entries(source)) output[key] = Util.deepClone(value);
      return output;
    }
    if (source instanceof Map) {
      const output = new source.constructor();
      for (const [key, value] of source.entries()) output.set(key, Util.deepClone(value));
      return output;
    }
    if (source instanceof Set) {
      const output = new source.constructor();
      for (const value of source.values()) output.add(Util.deepClone(value));
      return output;
    }
    return source;
  }

  static mergeDefault(def, given) {
    if (!given) return Util.deepClone(def);
    for (const key in def) {
      if (typeof given[key] === 'undefined') given[key] = Util.deepClone(def[key]);
      else if (Util.isObject(given[key])) given[key] = Util.mergeDefault(def[key], given[key]);
    }

    return given;
  }
}

module.exports = Util;
