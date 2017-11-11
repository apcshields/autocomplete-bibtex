'use babel';
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 */
const fs = require("fs");
const bibtexParse = require("./lite-bibtex-parse");

// TODO: convert bibtex to CSL Json standard?
export default class BibtexReader {
  constructor() {
    this.read = this.read.bind(this);
    this.fileTypes = ['bib', 'bibtex'];
  }

  read(file) {
    let references = [];
    let bibtexStr = fs.readFileSync(file, 'utf-8');
    const bibtex = bibtexParse.toJSON(bibtexStr);
    return references.concat(this.parseBibtexAuthors(bibtex));
  }

  parseBibtexAuthors(citations) {
    const validCitations = [];
    for (let citation of citations) {
      if (citation.author) {
        citation.authors = this.cleanAuthors(citation.author.split(' and '));
      }

      if (citation.editor) {
        citation.editors = this.cleanAuthors(citation.editor.split(' and '));
      }

      validCitations.push(citation);
    }

    return validCitations;
  }

  cleanAuthors(authors) {
    if ((!authors)) {
      return [{family: 'Unknown'}];
    }

    return (() => {
      const result = [];
      for (let author of authors) {
        const [family, given] =
            Array.from(author.indexOf(', ') !== -1 ? author.split(', ') : [author]);

        result.push({given, family});
      }
      return result;
    })();
  }
}
