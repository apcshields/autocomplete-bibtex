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
      // Title
      reference.title = ref.title;
      // Authors
      if (ref.author) {
        let authors = [];
        for (let author of Array.from(ref.author)) {
          na = {};
          if (author.literal) {
            na.family = author.literal;
            na.given = '';
          } else {
            na.family = author.family;
            na.given = author.given;
          }
          authors = authors.concat(na);
        }
        reference.authors = authors;
      }
      // Editors
      if (ref.editor) {
        let editors = [];
        for (let editor of Array.from(ref.editor)) {
          na = {};
          na.family = editor.family;
          na.given = editor.given;
          editors = editors.concat(na);
        }
        reference.editors = editors;
      }
      // Container title
      reference.in = '';
      if (ref['container-title']) {
        reference.in = ref['container-title'];
      }
      if (ref.volume) {
        reference.in += ` vol. ${ref.volume}`;
      }
      // URL ?
      if (ref.DOI) {
        reference.url = `http://dx.doi.org/${ref.DOI}`;
      } else if (ref.URL) {
        reference.url = ref.URL;
      }
      references = references.concat(reference);
    }
    return references;
  }
};
