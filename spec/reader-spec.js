
const path = require('path')
const BibtexReader = require("../lib/bibtex-reader")
const YamlReader = require("../lib/yaml-reader")
const CiteprocReader = require("../lib/citeproc-reader")

describe("Library Readers", function() {
  describe("BibtexReader", () =>

    it("loads a bibtex file", function() {
      const reader = new BibtexReader(path.join(__dirname, 'library-single.bib'))
      expect(reader).not.toEqual(null)
      const fileContents = reader.read()
      fileContents.then(contents => {
        expect(contents.length).toBeGreaterThan(0)
        expect(contents.length).toEqual(1)
      })

    })
  )

  describe("YamlReader", () =>

    it("loads a yaml file", function() {
      const reader = new YamlReader(path.join(__dirname, 'library-single.yaml'))
      expect(reader).not.toEqual(null)
      const fileContents = reader.read()
      fileContents.then(contents => {
        expect(contents.length).toBeGreaterThan(0)
        expect(contents.length).toEqual(1)
      })
    })
  )

  describe("CiteprocReader", () =>

    it("loads a json file", function() {
      const reader = new CiteprocReader(path.join(__dirname, 'library-single.json'))
      expect(reader).not.toEqual(null)
      const fileContents = reader.read()
      fileContents.then(contents => {
        expect(contents.length).toBeGreaterThan(0)
        expect(contents.length).toEqual(1)
      })
    })
  )
})
