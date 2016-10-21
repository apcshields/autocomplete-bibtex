fs = require "fs"
bibtexParse = require "zotero-bibtex-parse"
fuzzaldrin = require "fuzzaldrin"
XRegExp = require('xregexp').XRegExp
titlecaps = require "./titlecaps"
citeproc = require "./citeproc"
yaml = require "yaml-js"

module.exports =
class ReferenceProvider

  atom.deserializers.add(this)
  @version: 3
  @deserialize: ({data}) -> new ReferenceProvider(data)

  constructor: (state) ->
    if state and Object.keys(state).length != 0 and state.bibtex?
      @references = state.references
      @possibleWords = state.possibleWords
    else
      @buildWordListFromFiles(atom.config.get "autocomplete-bibtex.bibtex")

    if @references.length == 0
      @buildWordListFromFiles(atom.config.get "autocomplete-bibtex.bibtex")

    atom.config.onDidChange "autocomplete-bibtex.bibtex", (bibtexFiles) =>
      @buildWordListFromFiles(bibtexFiles)

    resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"
    atom.config.observe("autocomplete-bibtex.resultTemplate", (resultTemplate) =>
      @resultTemplate = resultTemplate
    )

    possibleWords = @possibleWords

    @provider =
      selector: atom.config.get "autocomplete-bibtex.scope"
      disableForSelector: atom.config.get "autocomplete-bibtex.ignoreScope"
      # Hack to supress default provider in MD files
      # inclusionPriority: 2
      # excludeLowerPriority: true

      compare: (a, b) ->
        if a.score < b.score
          return -1
        if a.score > b.score
          return 1
        return 0

      getSuggestions: ({editor, bufferPosition}) ->
        prefix = @getPrefix(editor, bufferPosition)

        new Promise (resolve) ->
          if prefix[0] == "@"
            normalizedPrefix = prefix.normalize().replace(/^@/, '')
            suggestions = []
            hits = fuzzaldrin.filter possibleWords, normalizedPrefix, { key: 'author' }

            for hit in hits
              hit.score = fuzzaldrin.score normalizedPrefix, hit.author

            hits.sort @compare

            resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"

            for word in hits
              suggestions.push {
                text: resultTemplate.replace("[key]", word.key)
                displayText: word.label
                replacementPrefix: prefix
                leftLabel: word.key
                rightLabel: word.by
                className: word.type
                iconHTML: '<i class="icon-mortar-board"></i>'
                description: word.in if word.in?
                descriptionMoreURL: word.url if word.url?
              }

            resolve(suggestions)

      getPrefix: (editor, bufferPosition) ->
        # Whatever your prefix regex might be
        regex = /@[\w-]+/
        wordregex = XRegExp('(?:^|[\\p{WhiteSpace}\\p{Punctuation}])@[\\p{Letter}\\p{Number}\._-]*')
        cursor = editor.getCursors()[0]
        start = cursor.getBeginningOfCurrentWordBufferPosition({ wordRegex: wordregex, allowPrevious: false })
        end = bufferPosition
        # Get the text for the line up to the triggered buffer position
        line = editor.getTextInRange([start, bufferPosition])
        # Match the regex to the line, and return the match
        line.match(regex)?[0] or ''

  serialize: -> {
    deserializer: 'ReferenceProvider'
    data: { references: @references, possibleWords: @possibleWords }
  }

  buildWordList: (references) =>
    possibleWords = []

    for citation in references
      if citation.entryTags and citation.entryTags.title and (citation.entryTags.authors or citation.entryTags.editors)
        citation.entryTags.title = citation.entryTags.title.replace(/(^\{|\}$)/g, "")
        citation.entryTags.prettyTitle =
          @prettifyTitle citation.entryTags.title

        citation.fuzzyLabel = citation.entryTags.title

        if citation.entryTags.authors?
          for author in citation.entryTags.authors
            citation.fuzzyLabel += " #{author.personalName} #{author.familyName}"

        if citation.entryTags.editors?
          for editor in citation.entryTags.editors
            citation.fuzzyLabel += " #{editor.personalName} #{editor.familyName}"

        if citation.entryTags.authors?
          citation.entryTags.prettyAuthors =
            @prettifyAuthors citation.entryTags.authors

          for author in citation.entryTags.authors
            possibleWords.push {
              author: @prettifyName(author),
              key: citation.citationKey,
              label: citation.entryTags.prettyTitle
              by: citation.entryTags.prettyAuthors
              type: citation.entryTags.type
              in: citation.entryTags.in or citation.entryTags.journal or citation.entryTags.booktitle
              url: citation.entryTags.url if citation.entryTags.url?
            }
        else
          possibleWords.push {
            author: '',
            key: citation.citationKey,
            label: citation.entryTags.prettyTitle
            by: ''
            type: citation.entryTags.type
            in: citation.entryTags.in or citation.entryTags.journal or citation.entryTags.booktitle
            url: citation.entryTags.url if citation.entryTags.url?
          }

    return possibleWords

  buildWordListFromFiles: (referenceFiles) =>
    @references = @readReferenceFiles(referenceFiles)
    @possibleWords = @buildWordList(@references)

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
        fileType = file.split('.').pop()

        if fs.statSync(file).isFile()
          if fileType is "json"
            citeprocObject = JSON.parse fs.readFileSync(file, 'utf-8')
            citeprocReferences = citeproc.parse citeprocObject
            references = references.concat citeprocReferences
          else if fileType is "yaml"
            citeprocObject = yaml.load fs.readFileSync(file, 'utf-8')
            citeprocReferences = citeproc.parse citeprocObject
            references = references.concat citeprocReferences
          else
            # Default to trying to parse as a BibTeX file.
            bibtexParser = new bibtexParse( fs.readFileSync(file, 'utf-8'))
            references = references.concat( @parseBibtexAuthors( bibtexParser.parse()))

        else
          console.warn("'#{file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.")
      return references
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

    # make title into titlecaps, trim length to 30 chars(ish) and add elipsis
    title = titlecaps(title)
    l = if title.length > 30 then 30 else title.length
    title = title.slice(0, l)
    n = title.lastIndexOf(" ")
    title = title.slice(0, n) + "..."

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

  prettifyAuthors: (authors) ->
    return '' if not authors?
    return '' if not authors.length

    name = @prettifyName authors[0]

    # remove leading and trailing {}
    name = name.replace /(^\{|\}$)/g, ""

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
