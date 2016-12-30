fs = require "fs"

RefView = require '../lib/ref-view'

describe "RefView", ->

  describe "Initialising a RefView", ->
    it "loads loads a reference JSON into the view", ->
      references = JSON.parse(fs.readFileSync(__dirname + '/library.json'))
      refView = new RefView(references)
      expect(refView).toExist()
