'use babel';

const fs = require("fs");
const fuzzaldrin = require("fuzzaldrin");
const titlecaps = require("./titlecaps");

const BibtexReader = require("./bibtex-reader");
const YamlReader = require("./yaml-reader");
const CiteprocReader = require("./citeproc-reader");

export default class ReferenceProvider {
  static deserialize({data}) {
    return new ReferenceProvider(data);
  }
  serialize() {
    return {
      deserializer: 'ReferenceProvider',
      data: {references: this.references}
    };
  }

  dispose() {
    return Array.from(this.watchedFiles).map(watch =>
        watch.close());
  }

  constructor(saveState) {
    saveState = null;
    atom.deserializers.add(this);
    this.version = 5;

      // TODO Could add a system to register additional readers
    this.fileReaders = [new BibtexReader(), new CiteprocReader(), new YamlReader()];

      // These are required for the provider api
    this.getSuggestions = this.getSuggestions.bind(this);
    this.enhanceReferences = this.enhanceReferences.bind(this);
    this.updateReferences = this.updateReferences.bind(this);
    this.registerReferenceFiles = this.registerReferenceFiles.bind(this);
    this.readReferenceFiles = this.readReferenceFiles.bind(this);
    this.readReferenceFile = this.readReferenceFile.bind(this);
    this.getFileReader = this.getFileReader.bind(this);
    this.prefixForCursor = this.prefixForCursor.bind(this);
    this.selector = atom.config.get("autocomplete-bibtex.scope");
    this.disableForSelector = atom.config.get("autocomplete-bibtex.ignoreScope");
      // Hack to supress default provider in MD files
      // inclusionPriority = 2
      // excludeLowerPriority = true

    this.referenceFiles = atom.config.get("autocomplete-bibtex.bibtex");
    if ((saveState) && (saveState.references)) {
      this.references = saveState.references;
    } else {
      this.updateReferences(this.referenceFiles);
    }

    this.watchedFiles = [];
    this.registerReferenceFiles(this.referenceFiles);

    atom.config.onDidChange("autocomplete-bibtex.bibtex", (newReferenceFiles, oldReferenceFiles) => {
    // TODO might want to add modifed checks to update references
      return this.updateReferences(newReferenceFiles);
    });

    this.resultTemplate = atom.config.get("autocomplete-bibtex.resultTemplate");

    atom.config.observe("autocomplete-bibtex.resultTemplate", resultTemplate => {
      this.resultTemplate = resultTemplate;
    });
  }

  getSuggestions({editor, bufferPosition}) {
    const prefix = this.getPrefix(editor, bufferPosition);

    return new Promise(resolve => {
      if (prefix[0] === "@") {
        const normalizedPrefix = prefix.normalize().replace(/^@/, '');
        const suggestions = [];
        // TODO filter author more fields than author.
        // suggest heirarchical starting with citeid, then author, then title
        // OR just use the 'fuzzyLabel'
        const hits = fuzzaldrin.filter(this.references, normalizedPrefix, {key: 'fuzzyLabel'});

        for (let hit of hits) {
          hit.score = fuzzaldrin.score(normalizedPrefix, hit.fuzzyLabel);
        }

        hits.sort(this.compare);
        // resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"
        // TODO change the icon depending on the document type
        for (let reference of hits) {
          let typeClass = "icon-mortar-board";
          if (reference.type === 'article' || reference.journal) {
            typeClass = "icon-file-text";
          } else if (reference.type === 'book' || reference.booktitle) {
            typeClass = "icon-repo";
          }

          suggestions.push({
            text: this.resultTemplate.replace("[key]", reference.id),
            displayText: reference.prettyTitle,
            replacementPrefix: prefix,
            leftLabel: reference.id,
            rightLabel: reference.prettyAuthors,
            className: reference.type,
            iconHTML: `<i class="${typeClass}"></i>`,
            description: (reference.in !== null) ? reference.in : undefined,
            descriptionMoreURL: (reference.url !== null) ? reference.url : undefined
          });
        }

        return resolve(suggestions);
      }
    });
  }

  compare(a, b) {
    if (a.score < b.score) {
      return -1;
    }
    if (a.score > b.score) {
      return 1;
    }
    return 0;
  }

  getPrefix(editor, bufferPosition) {
    // TODO might be a better way to do this...
    // Whatever your prefix regex might be
    const regex = /@[\w-]+/;
    const wordregex = /(?:^|[\s\S.,;:])@[\S\d._-]*/gi;

    const cursor = editor.getCursors()[0];
    const start = cursor.getBeginningOfCurrentWordBufferPosition(
      {wordRegex: wordregex, allowPrevious: false}
    );
    // const end = bufferPosition;
      // Get the text for the line up to the triggered buffer position
    const line = editor.getTextInRange([start, bufferPosition]);
      // Match the regex to the line, and return the match
    return __guard__(line.match(regex), x => x[0]) || '';
  }
  // TODO this seems to overlap too much with the reference list.
  // Better to merge and add to fuzzy search approach to handle list of authors...
  enhanceReferences(references) {
    for (let reference of references) {
      if (reference.title) {
        reference.title = reference.title.replace(/(^\{|\}$)/g, "");
        reference.prettyTitle = this.prettifyTitle(reference.title);
      }

      reference.fuzzyLabel = reference.id;

      if (reference.title) {
        reference.fuzzyLabel += ' ' + reference.title;
      }

      reference.prettyAuthors = '';
      if (reference.author) {
        reference.prettyAuthors = this.prettifyAuthors(reference.author);

        for (let author of Array.from(reference.author)) {
          reference.fuzzyLabel += ` ${author.given} ${author.family}`;
        }
      }

      if (reference.editors) {
        for (let editor of reference.editors) {
          reference.fuzzyLabel += ` ${editor.given} ${editor.family}`;
        }
      }

      reference.in = reference.in || reference.journal || reference.booktitle;
    }
    return references;
  }

  updateReferences(referenceFiles) {
    this.references = this.readReferenceFiles(referenceFiles);
    this.references = this.enhanceReferences(this.references);
  }

  registerReferenceFiles(referenceFiles) {
    this.watchedFiles = [];
    try {
      return (() => {
        const result = [];
        for (let file of Array.from(referenceFiles)) {
          if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            const watch = fs.watch(file, (eventType, filename) => {
              return this.updateReferences(referenceFiles);
            });
            result.push(this.watchedFiles.push(watch));
          } else {
            result.push(
              console.warn(
                `'${file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.`));
          }
        }
        return result;
      })();
    } catch (error) {
      return console.error(error);
    }
  }

  readReferenceFiles(referenceFiles) {
      // Read contents of refernce files
    if (!Array.isArray(referenceFiles)) {
      referenceFiles = [referenceFiles];
    }
    let references = [];
      // try
    for (let file of Array.from(referenceFiles)) {
        // What type of file is this?
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        references = references.concat(this.readReferenceFile(file));
      } else {
        console.warn(`'${file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.`);
      }
    }
      // catch error
      //   console.error error
    return references;
  }

  readReferenceFile(file) {
    const fileType = file.split('.').pop();
    const reader = this.getFileReader(fileType);
    return reader.read(file);
  }

  getFileReader(fileType) {
    for (let reader of this.fileReaders) {
      if (reader.fileTypes.includes(fileType)) {
        return reader;
      }
    }
  }
    /*
    This is a lightly modified version of AutocompleteManager.prefixForCursor
    which allows autocomplete-bibtex to define its own wordRegex.

    N.B. Setting `allowPrevious` to `false` is absolutely essential in order to
    make this perform as expected.
    */
  prefixForCursor(cursor, buffer) {
    if ((buffer === null) || (cursor === null)) {
      return '';
    }
    const start = cursor.getBeginningOfCurrentWordBufferPosition({wordRegex: this.wordRegex, allowPrevious: false});
    const end = cursor.getBufferPosition();
    if ((start === null) || (end === null)) {
      return '';
    }
    return buffer.getTextInRange([start, end]);
  }

  prettifyTitle(title) {
    let colon;
    if (!title) {
      return;
    }
    if (((colon = title.indexOf(':')) !== -1) && (title.split(" ").length > 5)) {
      title = title.substring(0, colon);
    }

      // make title into titlecaps, trim length to 30 chars(ish) and add elipsis
    title = titlecaps(title);
    const l = title.length > 30 ? 30 : title.length;
    title = title.slice(0, l);
    const n = title.lastIndexOf(" ");
    return title = title.slice(0, n) + "...";
  }

  prettifyAuthors(authors) {
    if ((authors == null)) {
      return '';
    }
    if (!authors.length) {
      return '';
    }

    let name = this.prettifyName(authors[0]);

      // remove leading and trailing {}
    name = name.replace(/(^\{|\}$)/g, "");

    if (authors.length > 1) {
      return `${name} et al.`;
    } return `${name}`;
  }

  prettifyName(person, inverted, separator) {
    if (inverted == null) {
      inverted = false;
    }
    if (separator == null) {
      separator = ' ';
    }
    if (inverted) {
      return this.prettifyName({
        given: person.family,
        family: person.given
      }, false, ', ');
    }
    return ((person.given) ? person.given : '') +
        ((person.given) && (person.family) ? separator : '') +
        ((person.family) ? person.family : '');
  }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}