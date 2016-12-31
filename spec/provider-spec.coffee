Provider = require '../lib/provider'

describe "Provider", ->

  describe "Initialising a provider", ->

    it "loads a bibtex file", ->
      atom.config.set("autocomplete-bibtex.bibtex", __dirname + '/library.bib')
      provider = new Provider()
      expect(provider).not.toEqual(null)

      expect(provider.references.length).toBeGreaterThan(0)

    it "loads a yaml file", ->
      atom.config.set("autocomplete-bibtex.bibtex", __dirname + '/library-single.yaml')

      provider = new Provider()
      expect(provider).not.toEqual(null)

      expect(provider.references.length).toBeGreaterThan(0)
      expect(provider.references.length).toEqual(1)
