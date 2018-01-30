'use babel'

const fs = require("fs-extra")
const path = require("path")
const bibtexParse = require("./lite-bibtex-parse")
const referenceTools = require("./reference-tools")

export default class BibtexReader {
  constructor() {
    this.read = this.read.bind(this)
    this.fileTypes = ['bib', 'bibtex']
    this.bibReaderWorker = null
  }

  // get fileTypes() {
  //   return ['bib', 'bibtex']
  // }

  interruptUpdate() {
    if (this.bibReaderWorker) {
      this.bibReaderWorker.terminate()
    }
  }

  async read(file) {
    // let bibtexStr = await fs.readFile(file, 'utf-8')

    // let bibtex = bibtexParse.toJSON(bibtexStr)
    // bibtex = referenceTools.enhanceReferences(bibtex)
    // return bibtex
    let bibtexStr = await fs.readFile(file, 'utf-8')
    this.bibReaderWorker = new Worker(path.join(__dirname, 'bibtex-lite-worker.js'))

    return new Promise((resolve, reject) => {
      this.bibReaderWorker.onmessage = msg => {
        let bibtex = msg.data
        this.bibReaderWorker.terminate()
        this.bibReaderWorker = null
        resolve(bibtex)
      }

      this.bibReaderWorker.postMessage(bibtexStr)
    })
  }
}
