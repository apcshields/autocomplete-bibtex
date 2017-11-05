fs = require "fs"
{CompositeDisposable} = require 'atom'

ReferenceProvider = require "./provider"
RefView = require './ref-view'

module.exports =
  config:
    bibtex:
      type: 'array'
      default: []
      items:
        type: 'string'
    scope:
      type: 'string'
      default: '.source.gfm,.text.md'
    ignoreScope:
      type: 'string'
      default: '.comment'
    resultTemplate:
      type: 'string'
      default: '@[key]'

  activate: (state) ->
    reload = false
    if state
      @saveTime = state.saveTime
      bibliographyFiles = atom.config.get "autocomplete-bibtex.bibtex"
      # reload everything if any files changed since serialisation
      for file in bibliographyFiles
        if fs.existsSync(file)
          stats = fs.statSync(file)
          if stats.isFile()
            if state.saveTime < stats.mtime.getTime()
              reload = true
              @saveTime = new Date().getTime()

    if state and reload is false
      @provider = atom.deserializers.deserialize(state.provider)
      #deserializer produces "undefined" if it fails, so double check
      if not @provider
        @provider = new ReferenceProvider()
    else
      @provider = new ReferenceProvider()

    @refView = new RefView(@provider.references)

    @commands = new CompositeDisposable()

    # TODO figure out how to show/hide commands for grammars
    @commands.add atom.commands.add 'atom-workspace',
        'bibliography:search': => @showSearch()
        'bibliography:reload': => @forceReload()

  showSearch: ->
    # @refView = new RefView(@referenceProvider.references)
    @refView.populateList()
    @refView.show()

  forceReload: ->
    @provider = new ReferenceProvider()
    @refView = new RefView(@provider.references)

    # @commands = new CompositeDisposable()
    #
    # # TODO figure out how to show/hide commands for grammars
    # @commands.add atom.commands.add 'atom-workspace',
    #     'bibliography:search': => @showSearch()
    #     'bibliography:reload': => @forceReload()

  deactivate: ->
    @commands.dispose()

  serialize: ->
    state = {
      provider: @provider.serialize()
      saveTime: new Date().getTime()
    }
    return state

  provide: ->
    @provider
