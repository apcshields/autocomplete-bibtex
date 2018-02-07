'use babel'

const util = require("./util")
const citeproc = require("./citeproc")
const yaml = require("yaml-js")
const referenceTools = require("./reference-tools")
const AbstractReader = require("./abstract-reader")

export default class YamlReader extends AbstractReader{
  static get fileTypes() {
    return ['yaml']
  }

  constructor(file) {
    super(file)
  }

  async read() {
    let references = []
    let cslStr = await util.readFile(this.file, 'utf-8')
    const citeprocObject = yaml.load(cslStr)
    const citeprocReferences = citeproc.parse(citeprocObject)
    return referenceTools.enhanceReferences(references.concat(citeprocReferences))
  }
}
