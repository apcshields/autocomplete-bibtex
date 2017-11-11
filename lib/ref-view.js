'use babel';

const {SelectListView} = require('atom-space-pen-views');

export default class RefView extends SelectListView {
  initialize(bibtex) {
    super.initialize();
    // @addClass('overlay from-top')
    this.addClass('reference-search');
    console.log(bibtex);
    this.setItems(bibtex);
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({item: this, visible: false});
    }
    this.resultTemplate = atom.config.get("autocomplete-bibtex.resultTemplate");
    return atom.config.observe("autocomplete-bibtex.resultTemplate", resultTemplate => {
      this.resultTemplate = resultTemplate;
    });
  }

  show() {
    this.panel.show();
    return this.focusFilterEditor();
  }

  toggle() {
    if (this.panel.isVisible()) {
      // @panel.hide()
    } else {
      this.panel.show();
      return this.focusFilterEditor();
    }
  }

  viewForItem(item) {
    if (item && item.title && item.author) {
      let typeClass = "icon-mortar-board";
      if (item.journal) {
        typeClass = "icon-file-text";
      } else if (item.booktitle) {
        typeClass = "icon-repo";
      }

      return `<li class="autocomplete-bibtex-entry">
<div>
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
</div>

</li>`;
    }
    return "";
  }

  confirmed(item) {
    // insert ref at cursor
    const editor = atom.workspace.getActiveTextEditor();
    const citekey = this.resultTemplate.replace('[key]', item.id);
    editor.insertText(citekey);
    return this.panel.hide();
  }

  cancel() {
    super.cancel(...arguments);
    if (this.panel.isVisible()) {
      return this.panel.hide();
    }
  }

  getFilterKey() {
    return 'fuzzyLabel';
  }
}

// author: @prettifyName(author, yes),
// key: citation.id,
// label: "#{citation.prettyTitle} \
//   by #{citation.prettyAuthors}"
// }
