'use babel';
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 */
const fs = require("fs");
const bibtexParse = require("./lite-bibtex-parse");

// TODO: convert bibtex to CSL Json standard?
// TODO: do the unicode conversion here, only on the name and title, for better perf.
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
