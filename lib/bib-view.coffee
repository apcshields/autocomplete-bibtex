
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
      return "<li></li>"

  confirmed: (item)->
    #insert ref at cursor
    console.log item

  getFilterKey: ->
    'label'

# author: @prettifyName(author, yes),
# key: citation.citationKey,
# label: "#{citation.entryTags.prettyTitle} \
#   by #{citation.entryTags.prettyAuthors}"
# }
