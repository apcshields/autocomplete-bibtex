fs = require "fs"

BibtexProvider = require "./provider"

module.exports =
  config:
    bibtex:
      type: 'string'
      default: ''
    scope:
      type: 'string'
      default: '.source.gfm'
    resultTemplate:
      type: 'string'
      default: '@[key]'

  activate: (state) ->
    reload = false
    if state
      bibtexFiles = atom.config.get "autocomplete-bibtex.bibtex"
      if not Array.isArray(bibtexFiles)
        bibtexFiles = [bibtexFiles]
      # reload everything if any files changed
      for file in bibtexFiles
        stats = fs.statSync(file)
        if stats.isFile()
          if state.saveTime < stats.mtime.getTime()
            reload = true

    # Need to distinguish between the Autocomplete provider and the
    # containing class (which holds the serialize fn)
    if state and reload is false
      @bibtexProvider = atom.deserializers.deserialize(state.provider)
      #deserializer produces "undefined" if it fails, so double check
      if not @bibtexProvider
        @bibtexProvider = new BibtexProvider()
    else
      @bibtexProvider = new BibtexProvider()

    @provider = @bibtexProvider.provider

  deactivate: ->
    @provider.registration.dispose()

  serialize: ->
    state = {
      provider: @bibtexProvider.serialize()
      saveTime: new Date().getTime()
    }
    return state


  provide: ->
    return { providers: [@provider] }
