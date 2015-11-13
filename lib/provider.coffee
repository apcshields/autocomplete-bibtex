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
  @version: 2
  @deserialize: ({data}) -> new ReferenceProvider(data)

  constructor: (state) ->
    if state and Object.keys(state).length != 0
      @bibtex = state.bibtex
      @possibleWords = state.possibleWords
    else
      @buildWordListFromFiles(atom.config.get "autocomplete-bibtex.bibtex")


    if @bibtex.length == 0
      @buildWordListFromFiles(atom.config.get "autocomplete-bibtex.bibtex")

    atom.config.onDidChange "autocomplete-bibtex.bibtex", (bibtexFiles) =>
      @buildWordListFromFiles(bibtexFiles)

    resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"
    atom.config.observe "autocomplete-bibtex.resultTemplate", (resultTemplate) =>
      @resultTemplate = resultTemplate

    allwords = @possibleWords

    @provider =
      selector: atom.config.get "autocomplete-bibtex.scope"
      disableForSelector: atom.config.get "autocomplete-bibtex.ignoreScope"
      inclusionPriority: 1
      excludeLowerPriority: true

      compare: (a,b) ->
        if a.score < b.score
          return -1
        if a.score > b.score
          return 1
        return 0

      getSuggestions: ({editor, bufferPosition}) ->
        prefix = @getPrefix(editor, bufferPosition)
        new Promise (resolve) ->
          if prefix[0] == "@"
            p = prefix.normalize().replace(/^@/, '')
            suggestions = []
            hits = fuzzaldrin.filter allwords, p, { key: 'author' }
            for h in hits
              h.score = fuzzaldrin.score(p, h.author)
            hits.sort @compare
            resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"
            for word in hits
              suggestion = {
                text: resultTemplate.replace("[key]", word.key)
                displayText: word.label
                replacementPrefix: prefix
                leftLabel: word.key
                rightLabel: word.by
                className: word.type
                iconHTML: '<i class="icon-mortar-board"></i>'
              }
              if word.in?
                suggestion.description = word.in
              if word.url?
                suggestion.descriptionMoreURL = word.url
              suggestions = suggestions.concat suggestion
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
    deserializer: 'BibtexProvider'
    data: { bibtex: @bibtex, possibleWords: @possibleWords }
  }

  buildWordList: () =>
    possibleWords = []
    for citation in @bibtex
      if citation.entryTags and citation.entryTags.title and (citation.entryTags.author or citation.entryTags.editor)
        citation.entryTags.prettyTitle =
          @prettifyTitle citation.entryTags.title

        citation.entryTags.authors = []
        citation.fuzzyLabel = citation.entryTags.title

        if citation.entryTags.author?
          citation.entryTags.author += citation.fuzzyLabel
          citation.entryTags.authors =
            citation.entryTags.authors.concat @cleanAuthors citation.entryTags.author.split ' and '

        if not citation.entryTags.editors
          if citation.entryTags.editor?
            citation.entryTags.authors =
              citation.entryTags.authors.concat @cleanAuthors citation.entryTags.editor.split ' and '

        citation.entryTags.prettyAuthors =
          @prettifyAuthors citation.entryTags.authors



        for author in citation.entryTags.authors
          new_word = {
            author: @prettifyName(author),
            key: citation.citationKey,
            label: "#{citation.entryTags.prettyTitle}"
            by: "#{citation.entryTags.prettyAuthors}"
            type: "#{citation.entryTags.type}"
          }
          if citation.entryTags.url?
            new_word.url = citation.entryTags.url
          if citation.entryTags.in?
            new_word.in = citation.entryTags.in
          possibleWords.push new_word

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

      for file in referenceFiles
        if fs.statSync(file).isFile()
          if ftype is "bib"
            parser = new bibtexParse(fs.readFileSync(file, 'utf-8'))
            references = references.concat parser.parse()

          else if ftype is "json"
            cpobject = JSON.parse fs.readFileSync(file, 'utf-8')
            citeproc_refs = citeproc.parse cpobject
            references = references.concat citeproc_refs

          else if ftype is "yaml"
            cpobject = yaml.load fs.readFileSync(file, 'utf-8')
            citeproc_refs = citeproc.parse cpobject
            references = references.concat citeproc_refs

          else
            # Default to trying to parse as a Bib file
            parser = new bibtexParse(fs.readFileSync(file, 'utf-8'))
            references = references.concat parser.parse()

        else
          console.warn("'#{file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.")

      @bibtex = references
    catch error
      console.error error

  prettifyTitle: (title) ->
    return if not title
    # Mendeley wraps title with double {{}}, while the parser
    # only removes one set of those. remove the second set here
    title = title.replace(/^\{/, "")
    title = title.replace(/\}$/, "")
    title = titlecaps(title)
    return title

  cleanAuthors: (authors) ->
    return [{ familyName: 'Unknown' }] if not authors?

    for author in authors
      [familyName, personalName] =
        if author.indexOf(', ') isnt -1 then author.split(', ') else [author]

      { personalName: personalName, familyName: familyName }

  prettifyAuthors: (authors) ->
    name = @prettifyName authors[0]
    if authors.length > 1 then "#{name} et al." else "#{name}"

  prettifyName: (person, separator = ' ') ->
    (if person.familyName? then person.familyName else '')
