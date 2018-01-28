'use babel'

const fs = require("fs-extra")
const citeproc = require("./citeproc")
const yaml = require("yaml-js")
const referenceTools = require("./reference-tools")

export default class YamlReader {
  constructor() {
    this.fileTypes = ['yaml']
  }
  async read(file) {
    let references = []
    let cslStr = await fs.readFile(file, 'utf-8')
    const citeprocObject = yaml.load(cslStr)
    const citeprocReferences = citeproc.parse(citeprocObject)
    return referenceTools.enhanceReferences(references.concat(citeprocReferences))
  }
}
