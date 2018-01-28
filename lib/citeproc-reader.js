'use babel'

const fs = require("fs-extra")
const citeproc = require("./citeproc")
const referenceTools = require("./reference-tools")

export default class CiteprocReader {

  constructor() {
    this.fileTypes = ['json']
  }
  async read(file) {
    let references = []
    let jsonStr = await fs.readFile(file, 'utf-8')
    const citeprocObject = JSON.parse(jsonStr)
    const citeprocReferences = citeproc.parse(citeprocObject)
    return referenceTools.enhanceReferences(references.concat(citeprocReferences))
  }
}
