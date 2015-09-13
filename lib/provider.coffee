fs = require "fs"
bibtexParse = require "zotero-bibtex-parse"
fuzzaldrin = require "fuzzaldrin"
XRegExp = require('xregexp').XRegExp
titlecaps = require "./titlecaps"
citeproc = require "./citeproc"
yaml = require "yaml-js"

module.exports =
class ReferenceProvider
  ###
  For a while, I intended to continue using XRegExp with this `wordRegex`:

  ```
  wordRegex: XRegExp('(?:^|\\p{WhiteSpace})@[\\p{Letter}\\p{Number}\._-]*')
  ```

  But I found that the regular expression given here seems to work well. If
  there are problems with Unicode characters, I can switch back to the other.

  This regular expression is also more lenient about what punctuation it will
  accept. Whereas the alternate only allows the punctuation which might be
  expected in a BibTeX key, this will accept all sorts. It does not accept a
  second `@`, as this would become confusing.
  ###
  wordRegex: XRegExp('(?:^|[\\p{WhiteSpace}\\p{Punctuation}])@[\\p{Letter}\\p{Number}\._-]*')

  atom.deserializers.add(this)
  @deserialize: ({data}) -> new ReferenceProvider(data)

  constructor: (state) ->
    console.log state
    if state and Object.keys(state).length != 0
      @references = state.references
      @possibleWords = state.possibleWords
    else
      @buildWordListFromFiles(atom.config.get "autocomplete-bibtex.references")

    if @references.length == 0
      @buildWordListFromFiles(atom.config.get "autocomplete-bibtex.references")

    atom.config.onDidChange "autocomplete-bibtex.references", (referenceFiles) =>
      @buildWordListFromFiles(referenceFiles)

    resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"
    atom.config.observe "autocomplete-bibtex.resultTemplate", (resultTemplate) =>
      @resultTemplate = resultTemplate

    @provider =
      selector: atom.config.get "autocomplete-bibtex.scope"
      disableForSelector: ".comment"

      getSuggestions: ({editor, bufferPosition}) ->
        prefix = @getPrefix(editor, bufferPosition)
        new Promise (resolve) ->
          suggestions = []
          for word in fuzzaldrin.filter state.possibleWords, prefix.normalize().replace(/^@/, ''), { key: 'author' }
            suggestion = {
              text: word.key
              displayText: word.label
              leftLabel: word.key
              type: "constant"
              iconHTML: '<i class="icon-move-right"></i>'
            }
            suggestions = suggestions.concat suggestion
          resolve(suggestions)

      getPrefix: (editor, bufferPosition) ->
        # Whatever your prefix regex might be
        regex = XRegExp('(?:^|[\\p{WhiteSpace}\\p{Punctuation}])@[\\p{Letter}\\p{Number}\._-]*')
        # Get the text for the line up to the triggered buffer position
        line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
        # Match the regex to the line, and return the match
        line.match(regex)?[0] or ''

    # return provider

  serialize: -> {
    deserializer: 'ReferenceProvider'
    data: { references: @references, possibleWords: @possibleWords }
  }

  buildWordList: () =>
    possibleWords = []
    for citation in @references
      if citation.entryTags and citation.entryTags.title and (citation.entryTags.authors or citation.entryTags.author or citation.entryTags.editor)

        citation.entryTags.prettyTitle =
          @prettifyTitle citation.entryTags.title

        if not citation.entryTags.authors
          citation.entryTags.authors = []
          if citation.entryTags.author?
            citation.entryTags.authors =
              citation.entryTags.authors.concat @cleanAuthors citation.entryTags.author.split ' and '

        if not citation.entryTags.editors
          if citation.entryTags.editor?
            citation.entryTags.authors =
              citation.entryTags.authors.concat @cleanAuthors citation.entryTags.editor.split ' and '

        citation.entryTags.prettyAuthors =
          @prettifyAuthors citation.entryTags.authors

        for author in citation.entryTags.authors
          possibleWords.push {
            author: @prettifyName(author, yes),
            key: citation.citationKey,
            label: "#{citation.entryTags.prettyTitle} \
              by #{citation.entryTags.prettyAuthors}"
          }

    @possibleWords = possibleWords

  buildWordListFromFiles: (referenceFiles) =>
    @readReferenceFiles(referenceFiles)
    @buildWordList()

  readReferenceFiles: (referenceFiles) =>
    if referenceFiles.newValue?
      referenceFiles = referenceFiles.newValue
    # Make sure our list of files is an array, even if it's only one file
    if not Array.isArray(referenceFiles)
      referenceFiles = [referenceFiles]
    try
      references = []
      for file in referenceFiles

        # What type of file is this?
        ftype = file.split('.')
        ftype = ftype[ftype.length - 1]

        if fs.statSync(file).isFile()

          if ftype is "bib"
            parser = new bibtexParse(fs.readFileSync(file, 'utf-8'))
            references = references.concat parser.parse()

          if ftype is "json"
            cpobject = JSON.parse fs.readFileSync(file, 'utf-8')
            citeproc_refs = citeproc.parse cpobject
            references = references.concat citeproc_refs

          if ftype is "yaml"
            cpobject = yaml.load fs.readFileSync(file, 'utf-8')
            citeproc_refs = citeproc.parse cpobject
            references = references.concat citeproc_refs

        else
          console.warn("'#{file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.")

      @references = references
    catch error
      console.error error

  ###
  This is a lightly modified version of AutocompleteManager.prefixForCursor
  which allows autocomplete-bibtex to define its own wordRegex.

  N.B. Setting `allowPrevious` to `false` is absolutely essential in order to
  make this perform as expected.
  ###
  prefixForCursor: (cursor, buffer) =>
    return '' unless buffer? and cursor?
    start = cursor.getBeginningOfCurrentWordBufferPosition({ wordRegex: @wordRegex, allowPrevious: false })
    end = cursor.getBufferPosition()
    return '' unless start? and end?
    buffer.getTextInRange([start, end])

  prettifyTitle: (title) ->
    return if not title
    if (colon = title.indexOf(':')) isnt -1 and title.split(" ").length > 5
      title = title.substring(0, colon)

    # make title into titlecaps, trim length to 70 chars(ish) and add elipsis
    title = titlecaps(title)
    cutoff = 45
    if title.length > cutoff
      title = title.slice(0, cutoff)
      n = title.lastIndexOf(" ")
      title = title.slice(0, n) + "..."
    return title

    # sugar function alternative
    # title.titleize().truncateOnWord 30, 'middle'

  cleanAuthors: (authors) ->
    return [{ familyName: 'Unknown' }] if not authors?

    for author in authors
      [familyName, personalName] =
        if author.indexOf(', ') isnt -1 then author.split(', ') else [author]

      { personalName: personalName, familyName: familyName }

  prettifyAuthors: (authors) ->
    name = @prettifyName authors[0]

    if authors.length > 1 then "#{name} et al." else "#{name}"

  prettifyName: (person, inverted = no, separator = ' ') ->
    if inverted
      @prettifyName {
        personalName: person.familyName,
        familyName: person.personalName
      }, no, ', '
    else
      (if person.personalName? then person.personalName else '') + \
      (if person.personalName? and person.familyName? then separator else '') + \
      (if person.familyName? then person.familyName else '')
