fs = require "fs"
bibtexParse = require "zotero-bibtex-parse"
fuzzaldrin = require "fuzzaldrin"
require "sugar"
XRegExp = require('xregexp').XRegExp

module.exports =
class BibtexProvider
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
  constructor: ->
    @bibtex = []

    @buildWordList(atom.config.get "autocomplete-bibtex.bibtex")
    atom.config.observe "autocomplete-bibtex.bibtex", (bibtexFiles) =>
      @buildWordList(bibtexFiles)

    resultTemplate = atom.config.get "autocomplete-bibtex.resultTemplate"
    atom.config.observe "autocomplete-bibtex.resultTemplate", (resultTemplate) =>
      @resultTemplate = resultTemplate

    provider =
      id: 'autocomplete-bibtex-bibtexprovider'
      selector: atom.config.get "autocomplete-bibtex.scope"
      blacklist: ''
      providerblacklist: '' # Give the user the option to configure this.
      requestHandler: (options) =>
        prefix = @prefixForCursor(options.cursor, options.buffer)

        ###
        Because the regular expression may a single whitespace or punctuation
        character before the part in which we're interested. Since this is the
        only case in which an `@` could be the second character, that's a simple
        way to test for it.

        (I put this here, and not in the `prefixForCursor` method because I want
        to keep that method as similar to the `AutocompleteManager` method of
        the same name as I can.)
        ###
        prefix = prefix[1..] if prefix[1] is '@'

        return if not prefix.length or prefix[0] is not '@'

        normalizedPrefix = prefix.normalize().replace(/^@/, '')

        words = fuzzaldrin.filter @possibleWords, normalizedPrefix, { key: 'author' }

        suggestions = for word in words
          {
            word: ' ' + @resultTemplate.replace('[key]', word.key)
            prefix: prefix
            label: word.label
            renderLabelAsHtml: false
            className: '',
            onWillConfirm: -> # Do something here before the word has replaced the prefix (if you need, you usually don't need to),
            onDidConfirm: -> # Do something here after the word has replaced the prefix (if you need, you usually don't need to)
          }
      dispose: ->
        # Your dispose logic here

    return provider

  buildWordList: (bibtexFiles) =>
    possibleWords = []

    @readBibtexFiles(bibtexFiles)

    for citation in @bibtex
      if citation.entryTags and citation.entryTags.title and citation.entryTags.author
        citation.entryTags.prettyTitle =
          @prettifyTitle citation.entryTags.title

        citation.entryTags.authors =
          @cleanAuthors citation.entryTags.author?.split ' and '
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

  readBibtexFiles: (bibtexFiles) =>
    # Make sure our list of BibTeX files is an array, even if it's only one file.
    if not Array.isArray(bibtexFiles)
      bibtexFiles = [bibtexFiles]

    try
      bibtex = []

      for file in bibtexFiles
        if fs.statSync(file).isFile()
          parser = new bibtexParse(fs.readFileSync(file, 'utf-8'))

          bibtex = bibtex.concat parser.parse()
        else
          console.warn("'#{file}' does not appear to be a file, so autocomplete-bibtex will not try to parse it.")

      @bibtex = bibtex
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

    if (colon = title.indexOf(':')) isnt -1 and title.words().length > 5
      title = title.substring(0, colon)

    title.titleize().truncateOnWord 30, 'middle'

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
