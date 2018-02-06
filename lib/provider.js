'use babel'
// TODO could probably roll this into the main.js
const fs = require("fs")

// const fuzzaldrin = require("fuzzaldrin")
const untildify = require('untildify')
const Fuse = require('fuse.js')

const BibtexReader = require("./bibtex-reader")
const YamlReader = require("./yaml-reader")
const CiteprocReader = require("./citeproc-reader")

const FILE_READERS = [BibtexReader, CiteprocReader, YamlReader]


function getFileReader(fileType) {
  for (let reader of FILE_READERS) {
    if (reader.fileTypes.includes(fileType)) {
      return reader
    }
  }
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}

function compare(a, b) {
  if (a.score < b.score) {
    return -1
  }
  if (a.score > b.score) {
    return 1
  }
  return 0
}

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
    this.watchedFiles.map(watch => watch.close())
  }

  constructor(saveState) {
    saveState = null
    this.version = 7
    this.name = 'ReferenceProvider'

    // At some point, should be able to drop the 'bind'
    // getSuggestions required for the provider api
    this.getSuggestions = this.getSuggestions.bind(this)
    this.registerReferenceFiles = this.registerReferenceFiles.bind(this)
    this.reload = this.reload.bind(this)

    this.watchedFiles = []

    // Hack to supress default provider in MD files
    // inclusionPriority = 2
    // excludeLowerPriority = true
    this.selector = atom.config.get("autocomplete-bibtex.scope")
    this.disableForSelector = atom.config.get("autocomplete-bibtex.ignoreScope")
    this.referenceFiles = atom.config.get("autocomplete-bibtex.bibtex")

    // if ((saveState) && (saveState.references)) {
    //   this.references = saveState.references
    //   this.watchedFiles = []
    //   this.registerReferenceFiles(this.referenceFiles)
    // } else {
    //   this.update()
    // }
    this.reload()

    atom.config.onDidChange("autocomplete-bibtex.bibtex", (newReferenceFiles, oldReferenceFiles) => {
      if (newReferenceFiles !== oldReferenceFiles) {
        this.reload()
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

  async getSuggestions({editor, bufferPosition}) {
    // TODO allow scope-specific prefixes
    const prefix = this.getPrefix(editor, bufferPosition)
    if (prefix[0] === "@") {
      let references = await this.references
      references = [].concat.apply([], references)
      const normalizedPrefix = prefix.normalize().replace(/^@/, '')

      let options = {
        keys: [
          {
            name: 'id',
            weight: 0.4
          },
          {
            name: 'title',
            weight: 0.3
          },
          {
            name: 'author',
            weight: 0.3
          }]
      }
      const fuse = new Fuse(references, options)

      const hits = fuse.search(normalizedPrefix)

      // TODO filter using Fusejs fuzzy finder
      // const hits = fuzzaldrin.filter(references, normalizedPrefix, {key: 'fuzzyLabel'})

      // for (let hit of hits) {
      //   hit.score = fuzzaldrin.score(normalizedPrefix, hit.fuzzyLabel)
      // }
      //
      // hits.sort(compare)

      const suggestions = []
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
          descriptionMarkdown: reference.markdownCite,
          descriptionMoreURL: (reference.url !== null) ? reference.url : undefined
        })
      }

      return suggestions
    }
  }

  get references() {
    return Promise.all(this.watchedFiles.map(f => f.references))
  }

  reload() {
    this.referenceFiles = atom.config.get("autocomplete-bibtex.bibtex")
    this.registerReferenceFiles(this.referenceFiles)
  }

  registerReferenceFiles(referenceFiles) {
    // Add file watchers to reference files to trigger update on changes.
    this.watchedFiles = []
    if (!Array.isArray(referenceFiles)) {
      referenceFiles = [referenceFiles]
    }
    for (let file of referenceFiles) {
      file = untildify(file.trim())
      if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
        const fileType = file.split('.').pop()
        const FileReader = getFileReader(fileType)
        this.watchedFiles.push(new FileReader(file))
      } else {
        atom.notifications.addWarning(
          `'${file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.`,
          {dismissable: true})
      }
    }
  }

  getPrefix(editor, bufferPosition) {
    // TODO alter the prefix depending on the document type
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
}

atom.deserializers.add(ReferenceProvider)
