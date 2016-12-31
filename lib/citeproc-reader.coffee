fs = require "fs"
citeproc = require "./citeproc"

module.exports =
class CiteprocReader
  fileTypes: ['json']
  read: (file) ->
    references = []
    citeprocObject = JSON.parse fs.readFileSync(file, 'utf-8')
    citeprocReferences = citeproc.parse citeprocObject
    references = references.concat citeprocReferences
