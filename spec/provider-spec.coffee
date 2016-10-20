Provider = require '../lib/provider'

describe "Provider", ->
  beforeEach ->
    atom.config.set("autocomplete-bibtex.bibtex", __dirname + '/library.bib')
  describe "Initialising a provider", ->
    it "loads a bibtex file", ->

      provider = new Provider()
      expect(provider).not.toEqual(null)
      console.log provider.bibtex

      expect(provider.bibtex.length).toBeGreaterThan(0)
