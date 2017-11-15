'use babel'

const fs = require("fs")
const fuzzaldrin = require("fuzzaldrin")
// const titlecaps = require("./titlecaps")
const referenceTools = require("./reference-tools")

const BibtexReader = require("./bibtex-reader")
const YamlReader = require("./yaml-reader")
const CiteprocReader = require("./citeproc-reader")

export default class ReferenceProvider {
  static deserialize({data}) {
    return new ReferenceProvider(data)
  }
  serialize() {
    return {
      deserializer: 'ReferenceProvider',
      data: {references: this.references}
    }
  }

  dispose() {
    return Array.from(this.watchedFiles).map(watch =>
        watch.close())
  }

  constructor(saveState) {
    saveState = null
    this.version = 5
    this.name = 'ReferenceProvider'

    // TODO Could add a system to register additional readers
    this.fileReaders = [new BibtexReader(), new CiteprocReader(), new YamlReader()]

      // These are required for the provider api
    this.getSuggestions = this.getSuggestions.bind(this)
    this.registerReferenceFiles = this.registerReferenceFiles.bind(this)
    this.readReferenceFiles = this.readReferenceFiles.bind(this)
    this.readReferenceFile = this.readReferenceFile.bind(this)
    this.getFileReader = this.getFileReader.bind(this)
    this.prefixForCursor = this.prefixForCursor.bind(this)
    this.selector = atom.config.get("autocomplete-bibtex.scope")
    this.disableForSelector = atom.config.get("autocomplete-bibtex.ignoreScope")
    this.update = this.update.bind(this)
    // Hack to supress default provider in MD files
    // inclusionPriority = 2
    // excludeLowerPriority = true

    this.referenceFiles = atom.config.get("autocomplete-bibtex.bibtex")
    if ((saveState) && (saveState.references)) {
      this.references = saveState.references
      this.watchedFiles = []
      this.registerReferenceFiles(this.referenceFiles)
    } else {
      this.update()
    }

    atom.config.onDidChange("autocomplete-bibtex.bibtex", (newReferenceFiles, oldReferenceFiles) => {
      if (newReferenceFiles !== oldReferenceFiles) {
        this.update()
      }
    })

    this.resultTemplate = atom.config.get("autocomplete-bibtex.resultTemplate")

    atom.config.observe("autocomplete-bibtex.resultTemplate", resultTemplate => {
      if (resultTemplate) {
        // Sometimes observe returns empty
        this.resultTemplate = resultTemplate
      }
    })
  }

  update() {
    this.referenceFiles = atom.config.get("autocomplete-bibtex.bibtex")
    this.references = this.readReferenceFiles(this.referenceFiles)
    this.watchedFiles = []
    this.registerReferenceFiles(this.referenceFiles)
  }

  registerReferenceFiles(referenceFiles) {
    // Add file watchers to reference files to trigger update on changes.
    this.watchedFiles = []
    const result = []
    for (let file of Array.from(referenceFiles)) {
      if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
        const watch = fs.watch(file, (eventType, filename) => {
          // FIXME nasty hack to wait until the new reference file is (probably) written
          // (Waiting for arbitray amount of time hoping for file to appear is disgusting)
          setTimeout(this.update, 300)
        })
        result.push(this.watchedFiles.push(watch))
      } else {
        atom.notifications.addWarning(
          `'${file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.`,
          {dismissable: true})
      }
    }
    return result
  }

  readReferenceFiles(referenceFiles) {
    // Read contents of reference files
    if (!Array.isArray(referenceFiles)) {
      referenceFiles = [referenceFiles]
    }
    let references = []
    for (let file of Array.from(referenceFiles)) {
      if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
        references = references.concat(this.readReferenceFile(file))
      } else {
        atom.notifications.addWarning(
          `'${file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.`,
          {dismissable: true})
      }
    }

    return referenceTools.enhanceReferences(references)
  }

  readReferenceFile(file) {
    const fileType = file.split('.').pop()
    const reader = this.getFileReader(fileType)
    return reader.read(file)
  }

  getFileReader(fileType) {
    for (let reader of this.fileReaders) {
      if (reader.fileTypes.includes(fileType)) {
        return reader
      }
    }
  }

  getSuggestions({editor, bufferPosition}) {
    const prefix = this.getPrefix(editor, bufferPosition)

    return new Promise(resolve => {
      if (prefix[0] === "@") {
        const normalizedPrefix = prefix.normalize().replace(/^@/, '')
        const suggestions = []
          // TODO filter author more fields than author.
          // suggest heirarchical starting with citeid, then author, then title
          // OR just use the 'fuzzyLabel'
        const hits = fuzzaldrin.filter(this.references, normalizedPrefix, {key: 'fuzzyLabel'})

        for (let hit of hits) {
          hit.score = fuzzaldrin.score(normalizedPrefix, hit.fuzzyLabel)
        }

        hits.sort(this.compare)
        // TODO change the icon depending on the document type
        for (let reference of hits) {
          let typeClass = "icon-mortar-board"
          if (reference.type === 'article' || reference.journal) {
            typeClass = "icon-file-text"
          } else if (reference.type === 'book' || reference.booktitle) {
            typeClass = "icon-repo"
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
          })
        }

        return resolve(suggestions)
      }
    })
  }

  compare(a, b) {
    if (a.score < b.score) {
      return -1
    }
    if (a.score > b.score) {
      return 1
    }
    return 0
  }

  getPrefix(editor, bufferPosition) {
      // TODO might be a better way to do this...
      // Whatever your prefix regex might be
    const regex = /@[\w-]+/
    const wordregex = /(?:^|[\s\S.,;:])@[\S\d._-]*/gi

    const cursor = editor.getCursors()[0]
    const start = cursor.getBeginningOfCurrentWordBufferPosition(
        {wordRegex: wordregex, allowPrevious: false}
      )
      // const end = bufferPosition;
        // Get the text for the line up to the triggered buffer position
    const line = editor.getTextInRange([start, bufferPosition])
        // Match the regex to the line, and return the match
    return __guard__(line.match(regex), x => x[0]) || ''
  }

  /*
  This is a lightly modified version of AutocompleteManager.prefixForCursor
  which allows autocomplete-bibtex to define its own wordRegex.

  N.B. Setting `allowPrevious` to `false` is absolutely essential in order to
  make this perform as expected.
  */
  prefixForCursor(cursor, buffer) {
    if ((buffer === null) || (cursor === null)) {
      return ''
    }
    const start = cursor.getBeginningOfCurrentWordBufferPosition({
      wordRegex: this.wordRegex,
      allowPrevious: false})
    const end = cursor.getBufferPosition()
    if ((start === null) || (end === null)) {
      return ''
    }
    return buffer.getTextInRange([start, end])
  }
}

atom.deserializers.add(ReferenceProvider)

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
