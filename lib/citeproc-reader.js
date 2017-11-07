'use babel';
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require("fs");
const citeproc = require("./citeproc");

export default class CiteprocReader {

   constructor() {
     this.fileTypes = ['json'];
   }
    read(file) {
      let references = [];
      const citeprocObject = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const citeprocReferences = citeproc.parse(citeprocObject);
      return references = references.concat(citeprocReferences);
    }
};
