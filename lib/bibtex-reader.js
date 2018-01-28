'use babel'

const fs = require("fs-extra")
const bibtexParse = require("./lite-bibtex-parse")
const referenceTools = require("./reference-tools")

export default class BibtexReader {
  constructor() {
    this.read = this.read.bind(this)
    this.fileTypes = ['bib', 'bibtex']
  }

  async read(file) {
    let bibtexStr = await fs.readFile(file, 'utf-8')
    let bibtex = bibtexParse.toJSON(bibtexStr)
    bibtex = referenceTools.enhanceReferences(bibtex)
    return bibtex
  }
}
