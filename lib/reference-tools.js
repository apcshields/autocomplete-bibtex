const small = "(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v[.]?|via|vs[.]?)"
const punct = "([!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]*)"

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

function enhanceReferences(references) {
  for (let reference of references) {
    if (reference.title) {
      reference.title = reference.title.replace(/(^\{|\}$)/g, "")
      reference.prettyTitle = this.prettifyTitle(reference.title)
    }
    reference.type = reference.type.toLowerCase()

    reference.fuzzyLabel = reference.id

    if (reference.title) {
      reference.fuzzyLabel += ' ' + reference.title
    }

    reference.prettyAuthors = ''
    if (reference.author) {
      reference.prettyAuthors = this.prettifyAuthors(reference.author)

      for (let author of Array.from(reference.author)) {
        reference.fuzzyLabel += ` ${author.given} ${author.family}`
      }
    }

    if (reference.editors) {
      for (let editor of reference.editors) {
        reference.fuzzyLabel += ` ${editor.given} ${editor.family}`
      }
    }

    reference.in = reference.in || reference.journal || reference.booktitle || ''

    let author = reference.prettyAuthors
    if (author) {
      author = `${author}, `
    }

    let refin = reference.in
    if (refin) {
      refin = `*${refin}*, `
    }

    let year = reference.year || ''

    reference.markdownCite = `${author}"**${reference.title}**", ${refin}${year}.`
  }
  return references
}

function prettifyTitle(title) {
  let colon
  if (!title) {
    return
  }
  if (((colon = title.indexOf(':')) !== -1) && (title.split(" ").length > 5)) {
    title = title.substring(0, colon)
  }

      // make title into titlecaps, trim length to 30 chars(ish) and add elipsis
  title = titleCaps(title)
  const l = title.length > 30 ? 30 : title.length
  title = title.slice(0, l)
  const n = title.lastIndexOf(" ")
  return title.slice(0, n) + "..."
}

function prettifyAuthors(authors) {
  if ((authors == null)) {
    return ''
  }
  if (!authors.length) {
    return ''
  }

  let name = this.prettifyName(authors[0])

      // remove leading and trailing {}
  name = name.replace(/(^\{|\}$)/g, "")

  if (authors.length > 1) {
    return `${name} et al.`
  }
  return `${name}`
}

function prettifyName(person, inverted, separator) {
  if (inverted === null || inverted === undefined) {
    inverted = false
  }
  if (separator === null || separator === undefined) {
    separator = ' '
  }
  if (inverted) {
    return this.prettifyName({
      given: person.family,
      family: person.given
    }, false, ', ')
  }
  return ((person.given) ? person.given : '') +
        ((person.given) && (person.family) ? separator : '') +
        ((person.family) ? person.family : '')
}

module.exports = {enhanceReferences, prettifyTitle, prettifyAuthors, prettifyName, titleCaps}
