fs = require "fs"
{CompositeDisposable} = require 'atom'

BibtexProvider = require "./provider"
BibView = require './bib-view'

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

    # @bibItems = @bibtexProvider.possibleWords

    @bibView = new BibView(@bibtexProvider.bibtex)

    @commands = new CompositeDisposable()

    # TODO figure out how to show/hide commands for grammars
    @commands.add atom.commands.add 'atom-workspace',
        # 'bibliography:search': => @bibView.toggle()
        'bibliography:search': => @showSearch()

  showSearch: ->
    @bibView = new BibView(@bibtexProvider.bibtex)
    @bibView.show()

  deactivate: ->
    @provider.registration.dispose()
    @commands.dispose()

  serialize: ->
    state = {
      provider: @bibtexProvider.serialize()
      saveTime: new Date().getTime()
    }
    return state


  provide: ->
    return { providers: [@provider] }
