'use babel'

/*
 * Title Caps
 *
 * Ported to JavaScript By John Resig - http://ejohn.org/ - 21 May 2008
 * Original by John Gruber - http://daringfireball.net/ - 10 May 2008
 * License: http://www.opensource.org/licenses/mit-license.php
 */

var small = "(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v[.]?|via|vs[.]?)"
var punct = "([!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]*)"

function titleCaps(title) {
  let parts = []
  let split = /[:.;?!] |(?: |^)["Ò]/g
  let index = 0

  while (true) {
    var m = split.exec(title)

    parts.push(title.substring(index, m ? m.index : title.length)
			.replace(/\b([A-Za-z][a-z.'Õ]*)\b/g, function(all) {
  return /[A-Za-z]\.[A-Za-z]/.test(all) ? all : upper(all)
})
			.replace(RegExp("\\b" + small + "\\b", "ig"), lower)
			.replace(RegExp("^" + punct + small + "\\b", "ig"), function(all, punct, word) {
  return punct + upper(word)
})
			.replace(RegExp("\\b" + small + punct + "$", "ig"), upper))

    index = split.lastIndex

    if (m) parts.push(m[0])
    else break
  }

  return parts.join("").replace(/ V(s?)\. /ig, " v$1. ")
		.replace(/(['Õ])S\b/ig, "$1s")
		.replace(/\b(AT&T|Q&A)\b/ig, function(all) {
  return all.toUpperCase()
})
}

function lower(word) {
  return word.toLowerCase()
}

function upper(word) {
  return word.substr(0, 1).toUpperCase() + word.substr(1)
}

module.exports = titleCaps
