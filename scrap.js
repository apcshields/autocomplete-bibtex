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
      word: @resultTemplate.replace('[key]', word.key)
      prefix: '@' + normalizedPrefix
      label: word.label
      renderLabelAsHtml: false
      className: '',
      onWillConfirm: -> # Do something here before the word has replaced the prefix (if you need, you usually don't need to),
      onDidConfirm: -> # Do something here after the word has replaced the prefix (if you need, you usually don't need to)
    }
dispose: ->
  # Your dispose logic here
