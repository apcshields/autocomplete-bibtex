/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require("fs");

const RefView = require('../lib/ref-view');

describe("RefView", () =>

  describe("Initialising a RefView", () =>
    it("loads loads a reference JSON into the view", function() {
      const references = JSON.parse(fs.readFileSync(__dirname + '/library.json'));
      const refView = new RefView(references);
      return expect(refView).toExist();
    })
  )
);
