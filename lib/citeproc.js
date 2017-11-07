/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {

  parse: cp => {
    if (!Array.isArray(cp)) {
      cp = [cp];
    }
    // Convert citeproc to internal format
    let references = [];
    for (let ref of Array.from(cp)) {
      var na;
      const cp_object = {};
      cp_object.citationKey = ref.id;
      cp_object.entryType = ref.type;
      const tags = {};
      // Title
      tags.title = ref.title;
      // Authors
      if (ref.author != null) {
        let authors = [];
        for (let author of Array.from(ref.author)) {
          na = {};
          if (author.literal != null) {
            na.familyName = author.literal;
            na.personalName = '';
          } else {
            na.familyName = author.family;
            na.personalName = author.given;
          }
          authors = authors.concat(na);
        }
        tags.authors = authors;
      }
      // Editors
      if (ref.editor != null) {
        let editors = [];
        for (let editor of Array.from(ref.editor)) {
          na = {};
          na.familyName = editor.family;
          na.personalName = editor.given;
          editors = editors.concat(na);
        }
        tags.editors = editors;
      }
      // Entry type
      tags.type = ref.type;
      // Container title
      tags.in = '';
      if (ref['container-title'] != null) {
        tags.in = ref['container-title'];
      }
      if (ref.volume != null) {
        tags.in += ` vol. ${ref.volume}`;
      }
      // URL ?
      if (ref.DOI != null) {
        tags.url = `http://dx.doi.org/${ref.DOI}`;
      } else if (ref.URL) {
        tags.url = ref.URL;
      }
      // Assign tags
      cp_object.entryTags = tags;
      references = references.concat(cp_object);
    }
    return references;
  }
};
