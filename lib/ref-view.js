/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

let RefView;
const {SelectListView} = require('atom-space-pen-views');

module.exports =
(RefView = class RefView extends SelectListView {
  initialize(bibtex){
    super.initialize();
    // @addClass('overlay from-top')
    this.addClass('reference-search');
    this.setItems(bibtex);
    if (this.panel == null) { this.panel = atom.workspace.addModalPanel({item: this, visible: false}); }
    this.resultTemplate = atom.config.get("autocomplete-bibtex.resultTemplate");
    return atom.config.observe("autocomplete-bibtex.resultTemplate", resultTemplate => {
      return this.resultTemplate = resultTemplate;
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

  viewForItem(item){
    if (item.entryTags && item.entryTags.title && item.entryTags.author) {

      let typeClass = "icon-mortar-board";
      if (item.entryTags.journal) {
        typeClass = "icon-file-text";
      } else if (item.entryTags.booktitle) {
        typeClass = "icon-repo";
      }


      return `<li class="autocomplete-bibtex-entry">
<div>
  <div class="icon-space">
      <i class="icon ${typeClass}"></i>
  </div>
  <div class="entry">
    <div class="author-line">
      <div>${item.entryTags.prettyAuthors}</div>
      <div class='citeKey'>[${item.citationKey}]</div>
    </div>
    <div class="title-line">
      ${item.entryTags.title}
    </div>
  </div>
</div>

</li>`;
    } else {
      return "";
    }
  }

  confirmed(item){
    //insert ref at cursor
    const editor = atom.workspace.getActiveTextEditor();
    const citekey = this.resultTemplate.replace('[key]', item.citationKey);
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
});

// author: @prettifyName(author, yes),
// key: citation.citationKey,
// label: "#{citation.entryTags.prettyTitle} \
//   by #{citation.entryTags.prettyAuthors}"
// }
