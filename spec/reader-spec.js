/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const BibtexReader = require("../lib/bibtex-reader")
const YamlReader = require("../lib/yaml-reader")
const CiteprocReader = require("../lib/citeproc-reader")

describe("Library Readers", function() {
  describe("BibtexReader", () =>

    it("loads a bibtex file", function() {
      const reader = new BibtexReader()
      expect(reader).not.toEqual(null)
      const fileContents = reader.read(__dirname + '/library-single.bib')
      fileContents.then(contents => {
        expect(contents.length).toBeGreaterThan(0)
        expect(contents.length).toEqual(1)
      })

    })
  )

  describe("YamlReader", () =>

    it("loads a yaml file", function() {
      const reader = new YamlReader()
      expect(reader).not.toEqual(null)
      const fileContents = reader.read(__dirname + '/library-single.yaml')
      fileContents.then(contents => {
        expect(contents.length).toBeGreaterThan(0)
        expect(contents.length).toEqual(1)
      })
    })
  )

  describe("CiteprocReader", () =>

    it("loads a json file", function() {
      const reader = new CiteprocReader()
      expect(reader).not.toEqual(null)
      const fileContents = reader.read(__dirname + '/library-single.json')
      fileContents.then(contents => {
        expect(contents.length).toBeGreaterThan(0)
        expect(contents.length).toEqual(1)
      })
    })
  )
})
