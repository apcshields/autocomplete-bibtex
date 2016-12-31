
{SelectListView} = require 'atom-space-pen-views'

module.exports =
class RefView extends SelectListView
  initialize: (bibtex)->
    super()
    # @addClass('overlay from-top')
    @addClass('reference-search')
    @setItems(bibtex)
    @panel ?= atom.workspace.addModalPanel(item: this, visible: false)
    @resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"
    atom.config.observe "autocomplete-bibtex.resultTemplate", (resultTemplate) =>
      @resultTemplate = resultTemplate

  show: ->
    @panel.show()
    @focusFilterEditor()

  toggle: ->
    if @panel.isVisible()
      # @panel.hide()
    else
      @panel.show()
      @focusFilterEditor()

  viewForItem: (item)->
    if item.entryTags and item.entryTags.title and item.entryTags.author

      typeClass = "icon-mortar-board"
      if item.entryTags.journal
        typeClass = "icon-file-text"
      else if item.entryTags.booktitle
        typeClass = "icon-repo"


      return """<li class="autocomplete-bibtex-entry">
      <div>
        <div class="icon-space">
            <i class="icon #{typeClass}"></i>
        </div>
        <div class="entry">
          <div class="author-line">
            <div>#{item.entryTags.prettyAuthors}</div>
            <div class='citeKey'>[#{item.citationKey}]</div>
          </div>
          <div class="title-line">
            #{item.entryTags.title}
          </div>
        </div>
      </div>

      </li>"""
    else
      return ""

  confirmed: (item)->
    #insert ref at cursor
    editor = atom.workspace.getActiveTextEditor()
    citekey = @resultTemplate.replace('[key]', item.citationKey)
    editor.insertText(citekey)
    @panel.hide()

  cancel: ->
    super
    if @panel.isVisible()
      @panel.hide()

  getFilterKey: ->
    'fuzzyLabel'

# author: @prettifyName(author, yes),
# key: citation.citationKey,
# label: "#{citation.entryTags.prettyTitle} \
#   by #{citation.entryTags.prettyAuthors}"
# }
