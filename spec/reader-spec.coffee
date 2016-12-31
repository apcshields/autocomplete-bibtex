BibtexReader = require "../lib/bibtex-reader"
YamlReader = require "../lib/yaml-reader"
CiteprocReader = require "../lib/citeproc-reader"

describe "Library Readers", ->

  describe "BibtexReader", ->

    it "loads a bibtex file", ->
      reader = new BibtexReader()
      expect(reader).not.toEqual(null)
      fileContents = reader.read(__dirname + '/library-single.bib')
      expect(fileContents.length).toBeGreaterThan(0)
      expect(fileContents.length).toEqual(1)

  describe "YamlReader", ->

    it "loads a yaml file", ->
      reader = new YamlReader()
      expect(reader).not.toEqual(null)
      fileContents = reader.read( __dirname + '/library-single.yaml')
      expect(fileContents.length).toBeGreaterThan(0)
      expect(fileContents.length).toEqual(1)

  describe "CiteprocReader", ->

    it "loads a json file", ->

      reader = new CiteprocReader()
      expect(reader).not.toEqual(null)
      fileContents = reader.read(__dirname + '/library-single.json')
      expect(fileContents.length).toBeGreaterThan(0)
      expect(fileContents.length).toEqual(1)
