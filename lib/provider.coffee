fs = require "fs"
bibtexParse = require "zotero-bibtex-parse"
fuzzaldrin = require "fuzzaldrin"
require "sugar"

module.exports =
class BibtexProvider
  constructor: ->
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
        prefix = options.prefix.replace /^@/, ''

        words = fuzzaldrin.filter @possibleWords, prefix, { key: 'author' }

        suggestions = for word in words
          {
            word: @resultTemplate.replace('[key]', word.key)
            prefix: "@#{prefix}" # The default word regexp strips the `@`, so we need to make sure that it is added but not, in case the regexp changes, duplicated.
            label: word.label
            renderLabelAsHtml: false
            className: '',
            onWillConfirm: -> # Do something here before the word has replaced the prefix (if you need, you usually don't need to),
            onDidConfirm: -> # Do something here after the word has replaced the prefix (if you need, you usually don't need to)
          }
      dispose: ->
        # Your dispose logic here

    @registration = atom.services.provide('autocomplete.provider', '1.0.0', { provider: provider })

  buildWordList: (bibtexFiles) =>
    possibleWords = []

    @readBibtexFiles(bibtexFiles)

    for citation in @bibtex
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
    try
      bibtex = []

      for file in bibtexFiles
        parser = new bibtexParse(fs.readFileSync(file, 'utf-8'))

        bibtex = bibtex.concat parser.parse()

      @bibtex = bibtex
    catch error
      console.error error

  prettifyTitle: (title) ->
    if (colon = title.indexOf(':')) isnt -1 and title.words().length > 5
      title = title.substring(0, colon)

    title.titleize().truncateOnWord 30, 'middle'

  cleanAuthors: (authors) ->
    if not authors? then return [{ familyName: 'Unknown' }]

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
