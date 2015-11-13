
# {View} = require 'space-pen'
{SelectListView} = require 'atom-space-pen-views'

module.exports =
class RefView extends SelectListView
  initialize: (bibtex)->
    super()
    # @addClass('overlay from-top')
    @addClass('reference-search')
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

      typeClass = "icon-mortar-board"
      if item.entryTags.journal
        typeClass = "icon-file-text"
      else if item.entryTags.booktitle
        typeClass = "icon-repo"


      return """<li><table>
      <tr>
        <td>
          <div class="icon-space">
            <i class="icon #{typeClass}"></i>
          </div>
        </td>
        <td>
        <div>
          <span>#{item.entryTags.prettyAuthors}</span>
          <span class='citeKey'><em>[#{item.citationKey}]</em></span>
          <br>
          <p class="secondary-line">#{item.entryTags.prettyTitle}</p>
        </div>
        </td>
      </tr>
      </table>

      </li>"""
    else
      return ""
# <div class="entry">
#   <span>#{item.entryTags.prettyAuthors}</span>
#   <span class='citeKey'>#{item.citationKey}</span>
#   <br>
#   <span>#{item.entryTags.prettyTitle}</span>
# </div>
# </div>
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
