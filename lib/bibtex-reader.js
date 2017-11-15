'use babel'

const fs = require("fs")
const bibtexParse = require("./lite-bibtex-parse")

// TODO: convert bibtex to CSL Json standard?
export default class BibtexReader {
  constructor() {
    this.read = this.read.bind(this)
    this.fileTypes = ['bib', 'bibtex']
  }

  read(file) {
    let references = []
    let bibtexStr = fs.readFileSync(file, 'utf-8')
    const bibtex = bibtexParse.toJSON(bibtexStr)
    return references.concat(bibtex)
  }
}
