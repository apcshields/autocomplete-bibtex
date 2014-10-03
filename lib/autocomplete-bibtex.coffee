_ = require "underscore-plus"
Autocomplete = require 'autocomplete-plus-minimal'
BibtexProvider = require "./bibtex-provider"

module.exports =
  editorSubscription: null
  providers: []
  autocomplete: null
  configDefaults:
    bibtex: ""
    fileBlacklist: "!*.{md,markdown,pandoc}"
    resultTemplate: "@[key]"

  ###
   * Registers a SnippetProvider for each editor view
  ###
  activate: ->
    @autocomplete = Autocomplete
    @autocomplete.activate()

    @registerProviders()

  ###
   * Registers a SnippetProvider for each editor view
  ###
  registerProviders: ->
    @editorSubscription = atom.workspaceView.eachEditorView (editorView) =>
      if editorView.attached and not editorView.mini
        provider = new BibtexProvider editorView

        @autocomplete.registerProviderForEditorView provider, editorView

        @providers.push provider

  ###
   * Cleans everything up, unregisters all SnippetProvider instances
  ###
  deactivate: ->
    @editorSubscription?.off()
    @editorSubscription = null

    @providers.forEach (provider) =>
      @autocomplete.unregisterProvider provider

    @providers = []
