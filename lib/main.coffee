BibtexProvider = require "./provider"

module.exports =
  configDefaults:
    bibtex: ""
    scope: ".source.gfm"
    resultTemplate: "@[key]"

  activate: ->
    @provider = new BibtexProvider()

  deactivate: ->
    @provider.registration.dispose()
