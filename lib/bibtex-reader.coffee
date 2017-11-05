fs = require "fs"
bibtexParse = require "zotero-bibtex-parse/zotero-bibtex-parse"
# TODO: maybe convert bibtex to CSL Json standard?
module.exports =
class BibtexReader
  fileTypes: ['bib', 'bibtex']
  read: (file) =>
    references = []
    bibtexParser = new bibtexParse( fs.readFileSync(file, 'utf-8'))
    references = references.concat( @parseBibtexAuthors( bibtexParser.parse()))

  parseBibtexAuthors: (citations) ->
    validCitations = []
    for citation in citations
      if citation.entryTags?
        if citation.entryTags.author?
          citation.entryTags.authors = @cleanAuthors citation.entryTags.author.split ' and '

        if citation.entryTags.editor?
          citation.entryTags.editors = @cleanAuthors citation.entryTags.editor.split ' and '

        validCitations.push(citation)

    return validCitations

  cleanAuthors: (authors) ->
    return [{ familyName: 'Unknown' }] if not authors?

    for author in authors
      [familyName, personalName] =
        if author.indexOf(', ') isnt -1 then author.split(', ') else [author]

      { personalName: personalName, familyName: familyName }
