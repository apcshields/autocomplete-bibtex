'use babel';
const fs = require("fs");
const citeproc = require("./citeproc");
const yaml = require("yaml-js");

export default class YamlReader {
    constructor() {
      this.fileTypes = ['yaml'];
    }
    read(file) {
      let references = [];
      const citeprocObject = yaml.load(fs.readFileSync(file, 'utf-8'));
      const citeprocReferences = citeproc.parse(citeprocObject);
      return references = references.concat(citeprocReferences);
    }
};
