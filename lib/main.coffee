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
      bibtexFiles = atom.config.get "autocomplete-bibtex.bibtex"
      # we want to remember the actual stateTime
      @stateTime = state.saveTime
      if not Array.isArray(bibtexFiles)
        bibtexFiles = [bibtexFiles]
      # reload everything if any files changed
      for file in bibtexFiles
        stats = fs.statSync(file)
        if stats.isFile()
          if state.saveTime < stats.mtime.getTime()
            reload = true
            @stateTime = new Date().getTime()

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

    # @bibItems = @referenceProvider.possibleWords

    @refView = new RefView(@referenceProvider.bibtex)

    @commands = new CompositeDisposable()

    # TODO figure out how to show/hide commands for grammars
    @commands.add atom.commands.add 'atom-workspace',
        'bibliography:search': => @showSearch()
        'bibliography:reload': => @forceReload()

  showSearch: ->
    # @refView = new RefView(@referenceProvider.bibtex)
    @refView.populateList()
    @refView.show()

  forceReload: ->
    @referenceProvider = new ReferenceProvider()
    @provider = @referenceProvider.provider
    @refView = new RefView(@referenceProvider.bibtex)


    # @bibItems = @referenceProvider.possibleWords
    @commands = new CompositeDisposable()

    # TODO figure out how to show/hide commands for grammars
    @commands.add atom.commands.add 'atom-workspace',
        'bibliography:search': => @showSearch()
        'bibliography:reload': => @forceReload()

  deactivate: ->
    @provider.registration.dispose()
    @commands.dispose()

  serialize: ->
    state = {
      provider: @referenceProvider.serialize()
      saveTime: new Date().getTime()
    }
    return state


  provide: ->
    @provider
