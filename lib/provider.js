'use babel';

const fs = require("fs");
const fuzzaldrin = require("fuzzaldrin");
// const {XRegExp} = require('xregexp');
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
      data: {references: this.references, possibleWords: this.possibleWords}
    };
  }

  dispose() {
    return Array.from(this.watchedFiles).map(watch =>
        watch.close());
  }

  constructor(saveState) {
    saveState = null;
    atom.deserializers.add(this);
    this.version = 4;

      // TODO Could add a system to register additional readers
    this.fileReaders = [new BibtexReader(), new CiteprocReader(), new YamlReader()];

      // These are required for the provider api
    this.getSuggestions = this.getSuggestions.bind(this);
    this.buildWordList = this.buildWordList.bind(this);
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
    if ((saveState) && (saveState.references) && (saveState.possibleWords)) {
      this.references = saveState.references;
      this.possibleWords = saveState.possibleWords;
    } else {
      this.updateReferences(this.referenceFiles);
    }

    this.watchedFiles = [];
    this.registerReferenceFiles(this.referenceFiles);

      // @updateReferences(@referenceFiles)

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
        const hits = fuzzaldrin.filter(this.possibleWords, normalizedPrefix, {key: 'author'});

        for (let hit of hits) {
          hit.score = fuzzaldrin.score(normalizedPrefix, hit.author);
        }

        hits.sort(this.compare);

          // resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"
          // TODO change the icon depending on the document type
          // typeClass = "icon-mortar-board"
          // if item.entryTags.journal
          //   typeClass = "icon-file-text"
          // else if item.entryTags.booktitle
          //   typeClass = "icon-repo"
        for (let word of hits) {
          suggestions.push({
            text: this.resultTemplate.replace("[key]", word.key),
            displayText: word.label,
            replacementPrefix: prefix,
            leftLabel: word.key,
            rightLabel: word.by,
            className: word.type,
            iconHTML: '<i class="icon-mortar-board"></i>',
            description: (word.in != null) ? word.in : undefined,
            descriptionMoreURL: (word.url != null) ? word.url : undefined
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
    // TODO can probably do without XRegExp
    // const wordregex = XRegExp('(?:^|[\\p{WhiteSpace}\\p{Punctuation}])@[\\p{Letter}\\p{Number}\._-]*');
    // const wordregex = /(^|[\s\.,;:])@[a-zA-Z0-1\._-]*'/;

    const cursor = editor.getCursors()[0];
    const start = cursor.getBeginningOfCurrentWordBufferPosition(
      // {wordRegex: wordregex, allowPrevious: false}
      {allowPrevious: false}
    );
    // const end = bufferPosition;
      // Get the text for the line up to the triggered buffer position
    const line = editor.getTextInRange([start, bufferPosition]);
      // Match the regex to the line, and return the match
    return __guard__(line.match(regex), x => x[0]) || '';
  }

  buildWordList(references) {
    const possibleWords = [];

    for (let citation of references) {
      if (citation.entryTags && citation.entryTags.title && (citation.entryTags.authors || citation.entryTags.editors)) {
        var author;
        citation.entryTags.title = citation.entryTags.title.replace(/(^\{|\}$)/g, "");
        citation.entryTags.prettyTitle =
            this.prettifyTitle(citation.entryTags.title);

        citation.fuzzyLabel = citation.entryTags.title;

        if (citation.entryTags.authors) {
          for (author of Array.from(citation.entryTags.authors)) {
            citation.fuzzyLabel += ` ${author.personalName} ${author.familyName}`;
          }
        }

        if (citation.entryTags.editors) {
          for (let editor of citation.entryTags.editors) {
            citation.fuzzyLabel += ` ${editor.personalName} ${editor.familyName}`;
          }
        }

        if (citation.entryTags.authors) {
          citation.entryTags.prettyAuthors =
              this.prettifyAuthors(citation.entryTags.authors);

          for (author of Array.from(citation.entryTags.authors)) {
            possibleWords.push({
              author: this.prettifyName(author),
              key: citation.citationKey,
              label: citation.entryTags.prettyTitle,
              by: citation.entryTags.prettyAuthors,
              type: citation.entryTags.type,
              in: citation.entryTags.in || citation.entryTags.journal || citation.entryTags.booktitle,
              url: (citation.entryTags.url !== null) ? citation.entryTags.url : undefined
            });
          }
        } else {
          possibleWords.push({
            author: '',
            key: citation.citationKey,
            label: citation.entryTags.prettyTitle,
            by: '',
            type: citation.entryTags.type,
            in: citation.entryTags.in || citation.entryTags.journal || citation.entryTags.booktitle,
            url: (citation.entryTags.url != null) ? citation.entryTags.url : undefined
          });
        }
      }
    }

    return possibleWords;
  }

  updateReferences(referenceFiles) {
    this.references = this.readReferenceFiles(referenceFiles);
    return this.possibleWords = this.buildWordList(this.references);
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
            result.push(console.warn(`'${file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.`));
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
        personalName: person.familyName,
        familyName: person.personalName
      }, false, ', ');
    }
    return ((person.personalName) ? person.personalName : '') +
        ((person.personalName) && (person.familyName) ? separator : '') +
        ((person.familyName) ? person.familyName : '');
  }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
