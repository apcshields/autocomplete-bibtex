module.exports = {

  // Add some properties to the CSL-JSON objects
  parse: cslJson => {
    if (!Array.isArray(cslJson)) {
      cslJson = [cslJson];
    }
    for (let reference of cslJson) {
      // Add family and given names if only literal is given
      // FIXME would be better to support literal explicitly
      if (reference.author) {
        let authors = [];
        for (let author of Array.from(reference.author)) {
          if (author.literal) {
            author.family = author.literal;
            author.given = '';
          }
        }
        reference.authors = authors;
      }

      // add 'in' field combining container title and volume
      reference.in = '';
      if (reference['container-title']) {
        reference.in = reference['container-title'];
      }
      if (reference.volume) {
        reference.in += ` vol. ${reference.volume}`;
      }
      // URL ?
      if (reference.DOI) {
        reference.url = `http://dx.doi.org/${reference.DOI}`;
      } else if (reference.URL) {
        reference.url = reference.URL;
      }
    }
    return cslJson;
  }
};
