'use babel'

const util = require("./util")
const path = require("path")
const bibtexParse = require("./lite-bibtex-parse")
const referenceTools = require("./reference-tools")
const AbstractReader = require("./abstract-reader")


export default class BibtexReader extends AbstractReader {

  static get fileTypes() {
    return ['bib', 'bibtex']
  }

  constructor(file) {
    super(file)
    this.bibReaderWorker = null
    this.references = this.read()
  }

  interruptUpdate() {
    if (this.bibReaderWorker) {
      this.bibReaderWorker.terminate()
      this.bibReaderWorker = null
    }
  }

  async read() {
    // let bibtexStr = await fs.readFile(file, 'utf-8')
    // let bibtex = bibtexParse.toJSON(bibtexStr)
    // bibtex = referenceTools.enhanceReferences(bibtex)
    // return bibtex
    // TODO error handlng for parse
    // Offload the CPU intensive parsing of the bibtex file to a web worker
    let bibtexStr = await util.readFile(this.file, 'utf-8')
    this.bibReaderWorker = new Worker(path.join(__dirname, 'bibtex-lite-worker.js'))

    return new Promise((resolve, reject) => {
      this.bibReaderWorker.onmessage = msg => {
        let bibtex = msg.data
        this.bibReaderWorker.terminate()
        // this.bibReaderWorker = null
        resolve(bibtex)
      }

      this.bibReaderWorker.postMessage(bibtexStr)
    })
  }
}
