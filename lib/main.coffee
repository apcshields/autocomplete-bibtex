fs = require "fs"

ReferenceProvider = require "./provider"

module.exports =
  config:
    references:
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

  activate: (state) ->
    reload = false
    if state
      referenceFiles = atom.config.get "autocomplete-bibtex.references"
      if not Array.isArray(referenceFiles)
        referenceFiles = [referenceFiles]
      # reload everything if any files changed
      for file in referenceFiles
        stats = fs.statSync(file)
        if stats.isFile()
          if state.saveTime < stats.mtime.getTime()
            reload = true

    # Need to distinguish between the Autocomplete provider and the
    # containing class (which holds the serialize fn)
    if state and reload is false
      @referenceProvider = atom.deserializers.deserialize(state.provider)
      #deserializer produces "undefined" if it fails, so double check
      if not @referenceProvider
        @referenceProvider = new ReferenceProvider()
    else
      @referenceProvider = new ReferenceProvider()

    @provider = @referenceProvider.provider

  deactivate: ->
    @provider.registration.dispose()

  serialize: ->
    state = {
      provider: @referenceProvider.serialize()
      saveTime: new Date().getTime()
    }
    return state


  provide: ->
    @provider
