
# {View} = require 'space-pen'
{SelectListView} = require 'atom-space-pen-views'

module.exports =
class BibView extends SelectListView
  initialize: (bibtex)->
    super()
    @addClass('overlay from-top')
    @setItems(bibtex)
    @panel ?= atom.workspace.addModalPanel(item: this, visible: false)
    # @panel.show()
    @resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"
    atom.config.observe "autocomplete-bibtex.resultTemplate", (resultTemplate) =>
      @resultTemplate = resultTemplate

  show: ->
    @panel.show()
    @focusFilterEditor()

  toggle: ->
    if @panel.isVisible()
      @panel.hide()
    else
      @panel.show()
      @focusFilterEditor()

  viewForItem: (item)->
    # console.log item
    if item.entryTags and item.entryTags.title and item.entryTags.author
      return "<li><span>#{item.entryTags.author}</span>&nbsp;<span>#{item.entryTags.title}</span></li>"
    else
      return ""

  confirmed: (item)->
    #insert ref at cursor
    console.log item
    editor = atom.workspace.getActiveTextEditor()
    citekey = @resultTemplate.replace('[key]', item.citationKey)
    editor.insertText(citekey)
    @panel.hide()

  getFilterKey: ->
    'label'

# author: @prettifyName(author, yes),
# key: citation.citationKey,
# label: "#{citation.entryTags.prettyTitle} \
#   by #{citation.entryTags.prettyAuthors}"
# }
