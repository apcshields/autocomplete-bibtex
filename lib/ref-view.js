'use babel'

const SelectList = require('atom-select-list')

export default class RefView {
  constructor(provider) {
    this.provider = provider
    this.selectListView = new SelectList({
      items: this.provider.references,
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
        // const filterKeys = ['title', 'author', 'journal', 'year']
        // let filterKey = ''
        // for (let key of filterKeys) {
        //   if (item[key]) {
        //     filterKey = filterKey + ' ' + item[key]
        //   }
        // }
        return item.fuzzyLabel
      },
      didConfirmSelection: item => {
        this.hide()

        // insert ref at cursor
        const editor = atom.workspace.getActiveTextEditor()
        const citekey = this.resultTemplate.replace('[key]', item.id)
        editor.insertText(citekey)
        // this.panel.hide()
      },
      didCancelSelection: () => {
        if (this.panel.isVisible()) {
          this.panel.hide()
        }
        this.hide()
      }
    }) // end of select list

    this.selectListView.element.classList.add('autocomplete-bibtex')

    this.resultTemplate = atom.config.get("autocomplete-bibtex.resultTemplate")
    atom.config.observe("autocomplete-bibtex.resultTemplate", resultTemplate => {
      this.resultTemplate = resultTemplate
    })
  }

  async show() {
    // Adapted from command palette
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({item: this.selectListView})
    }
    this.selectListView.update(this.provider.references)
    this.selectListView.reset()
    this.previouslyFocusedElement = document.activeElement
    this.panel.show()
    this.selectListView.focus()
  }

  toggle() {
    if (this.panel && this.panel.isVisible()) {
      this.hide()
      return Promise.resolve()
    }
    return this.show()
  }

  hide() {
    this.panel.hide()
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
      this.previouslyFocusedElement = null
    }
  }

  update(items) {
    this.selectListView.update(items)
  }
}
