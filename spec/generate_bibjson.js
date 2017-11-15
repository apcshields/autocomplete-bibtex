// Script to dump some bibtex as csl-json

const bibparser = require("../lib/lite-bibtex-parse")
const fs = require('fs')

const referenceTools = require("../lib/reference-tools")


function main() {
  let file = fs.readFileSync(__dirname + '/library.bib',  'utf-8')
  let bibjson = referenceTools.enhanceReferences(bibparser.toJSON(file))
  fs.writeFileSync('library.json', JSON.stringify(bibjson))
}

main()
