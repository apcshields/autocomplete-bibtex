'use babel'

const SelectList = require('atom-select-list')

// FIXME focus / auto focus doesn't work, esc key doesn't work...
export default class RefView {
  constructor(items) {
    // TODO add custom filter to allow search on many fields
    this.selectList = new SelectList({
      items: items,
      maxResults: 10,
      elementForItem: item => {
        if (item) {
          if (!item.title) item.title = '--'
          if (!item.author) item.author = '--'

          let typeClass = "icon-mortar-board"
          if (item.type === 'article' || item.journal) {
            typeClass = "icon-file-text"
          } else if (item.type === 'book' || item.booktitle) {
            typeClass = "icon-repo"
          }
          let el = document.createElement('li')
          el.innerHTML = `<div class="autocomplete-bibtex-entry">
        <div class="icon-space">
            <i class="icon ${typeClass}"></i>
        </div>
        <div class="entry">
          <div class="author-line">
            <div>${item.prettyAuthors}</div>
            <div class='citeKey'>[${item.id}]</div>
          </div>
          <div class="title-line">
            ${item.title}
          </div>
        </div>
      </div>`
          return el
        }
        return document.createElement('li')
      },
      filterKeyForItem: item => {
        const filterKeys = ['title', 'author', 'journal', 'year']
        let filterKey = ''
        for (let key of filterKeys) {
          if (item[key]) {
            filterKey = filterKey + ' ' + item[key]
          }
        }
        return filterKey
      },
      didConfirmSelection: item => {
        // insert ref at cursor
        const editor = atom.workspace.getActiveTextEditor()
        const citekey = this.resultTemplate.replace('[key]', item.id)
        editor.insertText(citekey)
        this.panel.hide()
      },
      didCancelSelection: () => {
        if (this.panel.isVisible()) {
          this.panel.hide()
        }
        this.hide()
      }
    }) // end of select list

    // Add select list to modal
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({
        item: this.selectList.element,
        visible: false,
        autoFocus: true
      })
    }
    this.resultTemplate = atom.config.get("autocomplete-bibtex.resultTemplate")
    atom.config.observe("autocomplete-bibtex.resultTemplate", resultTemplate => {
      this.resultTemplate = resultTemplate
    })
  }

  show() {
    this.panel.show()
  }

  toggle() {
    if (this.panel.isVisible()) {
      // @panel.hide()
    } else {
      this.panel.show()
    }
  }

  hide() {
    this.panel.hide()
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
  }

  update(items) {
    this.selectList.update(items)
  }
}
