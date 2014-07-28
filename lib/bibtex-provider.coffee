{Range}  = require "atom"
{Provider, Suggestion} = require "autocomplete-plus"
fuzzaldrin = require "fuzzaldrin"
_ = require "underscore-plus"
fs = require "fs"

module.exports =
class BibtexProvider extends Provider
  wordRegex: /@[a-zA-Z0-9\._-]*/g
  keyRegex: /@\w+{(\w+),/g
  exclusive: true
  initialize: ->
    bibtex = ''
    files = atom.config.get "autocomplete-bibtex.bibtex"

    for file in files
      try
        bibtex += fs.readFileSync file, 'utf-8'
      catch error
        console.error error

    @possibleWords = while (key = @keyRegex.exec(bibtex))
      key[1]

  buildSuggestions: ->
    selection = @editor.getSelection()
    prefix = @prefixOfSelection selection
    return unless prefix.length

    suggestions = @findSuggestionsForPrefix prefix
    return unless suggestions.length
    return suggestions

  findSuggestionsForPrefix: (prefix) ->
    prefix = prefix.replace /^@/, ''

    words = fuzzaldrin.filter @possibleWords, prefix

    suggestions = for word in words
      new Suggestion this, word: word, prefix: prefix, label: "@#{word}"

    return suggestions
