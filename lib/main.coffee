BibtexProvider = require "./provider"

module.exports =
  config:
    bibtex:
      type: 'array'
      default: []
      items:
        type: 'string'
    scope:
      type: 'string'
      default: '.source.gfm'
    resultTemplate:
      type: 'string'
      default: '@[key]'

  activate: ->
    @provider = new BibtexProvider()

  deactivate: ->
    @provider.registration.dispose()

  provide: ->
    return { providers: [@provider] }
