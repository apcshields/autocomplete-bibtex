/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Provider = require('../lib/provider');
const path = require('path');

describe("Provider", () =>

  describe("Initialising a provider", function() {
    it("loads a bibtex file", function() {
      atom.config.set("autocomplete-bibtex.bibtex", path.join(__dirname, 'library.bib'));
      const provider = new Provider();
      expect(provider).not.toEqual(null);

      return expect(provider.references.length).toBeGreaterThan(0);
    });

    return it("loads a yaml file", function() {
      atom.config.set("autocomplete-bibtex.bibtex", path.join(__dirname, '/library-single.yaml'));

      const provider = new Provider();
      expect(provider).not.toEqual(null);

      expect(provider.references.length).toBeGreaterThan(0);
      return expect(provider.references.length).toEqual(1);
    });
  })
);
