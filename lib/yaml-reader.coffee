fs = require "fs"
citeproc = require "./citeproc"
yaml = require "yaml-js"

module.exports =
class YamlReader
  fileTypes: ['yaml']
  read: (file) ->
    references = []
    citeprocObject = yaml.load fs.readFileSync(file, 'utf-8')
    citeprocReferences = citeproc.parse citeprocObject
    references = references.concat citeprocReferences
