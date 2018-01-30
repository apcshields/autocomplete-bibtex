'use babel'

const fs = require("fs")
const bibtexParse = require("./lite-bibtex-parse")
const referenceTools = require("./reference-tools")

process.on('message', file => {
  let bibtexStr = fs.readFile(file, 'utf-8', fileStr => {
    let bibtex = bibtexParse.toJSON(bibtexStr)
    bibtex = referenceTools.enhanceReferences(bibtex)
    process.send(bibtex)
  })
})
