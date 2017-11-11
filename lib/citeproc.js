module.exports = {

  parse: cp => {
    if (!Array.isArray(cp)) {
      cp = [cp];
    }
    // Convert citeproc to internal format
    let references = [];
    for (let ref of cp) {
      var na;
      const reference = {};
      reference.id = ref.id;
      reference.type = ref.type;
      const tags = {};
      // Title
      tags.title = ref.title;
      // Authors
      if (ref.author != null) {
        let authors = [];
        for (let author of Array.from(ref.author)) {
          na = {};
          if (author.literal != null) {
            na.family = author.literal;
            na.given = '';
          } else {
            na.family = author.family;
            na.given = author.given;
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
          na.family = editor.family;
          na.given = editor.given;
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
      reference.tags = tags;
      references = references.concat(reference);
    }
    return references;
  }
};
