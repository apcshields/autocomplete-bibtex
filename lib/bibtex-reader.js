'use babel';
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require("fs");
const bibtexParse = require("zotero-bibtex-parse/zotero-bibtex-parse");
// TODO: maybe convert bibtex to CSL Json standard?
export default class BibtexReader {
  constructor() {
    this.read = this.read.bind(this);
    this.fileTypes = ['bib', 'bibtex'];
  }

  read(file) {
    let references = [];
    const bibtexParser = new bibtexParse(fs.readFileSync(file, 'utf-8'));
    return references.concat(this.parseBibtexAuthors(bibtexParser.parse()));
  }

  parseBibtexAuthors(citations) {
    const validCitations = [];
    for (let citation of citations) {
      if (citation.entryTags) {
        if (citation.entryTags.author) {
          citation.entryTags.authors = this.cleanAuthors(citation.entryTags.author.split(' and '));
        }

        if (citation.entryTags.editor) {
          citation.entryTags.editors = this.cleanAuthors(citation.entryTags.editor.split(' and '));
        }

        validCitations.push(citation);
      }
    }

    return validCitations;
  }

  cleanAuthors(authors) {
    if ((!authors)) {
      return [{familyName: 'Unknown'}];
    }

    return (() => {
      const result = [];
      for (let author of authors) {
        const [familyName, personalName] =
            Array.from(author.indexOf(', ') !== -1 ? author.split(', ') : [author]);

        result.push({personalName, familyName});
      }
      return result;
    })();
  }
}
