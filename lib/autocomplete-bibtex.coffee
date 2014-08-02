_ = require "underscore-plus"
path = require "path"
minimatch = require "minimatch"
BibtexProvider = require "./bibtex-provider"

module.exports =
  editorSubscription: null
  providers: []
  autocomplete: null

  ###
   * Registers a SnippetProvider for each editor view
  ###
  activate: ->
    atom.packages.activatePackage("autocomplete-plus")
      .then (pkg) =>
        @autocomplete = pkg.mainModule
        @registerProviders()

  ###
   * Registers a SnippetProvider for each editor view
  ###
  registerProviders: ->
    @editorSubscription = atom.workspaceView.eachEditorView (editorView) =>
      if editorView.attached and not editorView.mini
        provider = new BibtexProvider editorView

        @autocomplete.registerProviderForEditorView provider, editorView

        # Unregister other providers?
        # Can we get the class name of each provider?
        # Yes. (provider.constructor.name)
        # We'll need it and the buffer file extension.

        try
          if atom.config.get("autocomplete-bibtex.suppressOtherProvidersInMarkdown") \
          and minimatch(path.basename(editorView.editor.getBuffer().getPath()), '*.md')

            autocompleteView = _.findWhere(@autocomplete.autocompleteViews, \
              editorView: editorView)

            console.error autocompleteView.providers
            console.error autocompleteView.unregisterProvider

            try
              for badProvider in autocompleteView.providers \
              when badProvider.constructor.name isnt 'BibtexProvider'
                try
                  autocompleteView.unregisterProvider(badProvider)
                catch error
                  console.error error
            catch error
              console.error error

            ###
            console.error badProvider.constructor.name for badProvider in \
            autocompleteView.providers when \
            badProvider.constructor.name isnt 'BibtexProvider'
            ###
        catch error
          console.error error

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
