'use babel'

const util = require("./util")
const citeproc = require("./citeproc")
const referenceTools = require("./reference-tools")
const AbstractReader = require("./abstract-reader")

export default class CiteprocReader extends AbstractReader{
  static get fileTypes() {
    return ['json']
  }
  constructor(file) {
    super(file)
  }

  async read() {
    let references = []
    let jsonStr = await util.readFile(this.file, 'utf-8')
    const citeprocObject = JSON.parse(jsonStr)
    const citeprocReferences = citeproc.parse(citeprocObject)
    return referenceTools.enhanceReferences(references.concat(citeprocReferences))
  }
}
