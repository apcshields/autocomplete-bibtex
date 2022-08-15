'use babel'
/*
'Lite' version nodified to output CSL-JSON compatible entries
(e.g convert authors string to CSL authors structure) and to ignore comments and preambles
Also only converts latex to utf8 for title and author fields, otherwise seems very slow.

Based on:
Original work by Henrik Muehe (c) 2010
CommonJS port by Mikola Lysenko 2013
Choice of compact (default) or pretty output from toBibtex: Nick Bailey, 2017.
Port to Browser lib by ORCID / RCPETERS

*/

// Issues:
// no comment handling within strings
// no string concatenation
// no variable values yet
// Grammar implemented here:
// bibtex -> (string | preamble | comment | entry)*;
// string -> '@STRING' '{' key_equals_value '}';
// preamble -> '@PREAMBLE' '{' value '}';
// comment -> '@COMMENT' '{' value '}';  <= disabled, for completion don't need comments
// entry -> '@' key '{' key ',' key_value_list '}';
// key_value_list -> key_equals_value (',' key_equals_value)*;
// key_equals_value -> key '=' value;
// value -> value_quotes | value_braces | key;
// value_quotes -> '"' .*? '"'; // not quite
// value_braces -> '{' .*? '"'; // not quite

importScripts('latexUni.min.js')
importScripts('reference-tools.js')


const LATEX_TO_UNI = {
  "`A": "À", // begin grave
  "`E": "È",
  "`I": "Ì",
  "`O": "Ò",
  "`U": "Ù",
  "`a": "à",
  "`e": "è",
  "`i": "ì",
  "`o": "ò",
  "`u": "ù",
  "\'A": "Á", // begin acute
  "\'E": "É",
  "\'I": "Í",
  "\'O": "Ó",
  "\'U": "Ú",
  "\'Y": "Ý",
  "\'a": "á",
  "\'e": "é",
  "\'i": "í",
  "\'o": "ó",
  "\'u": "ú",
  "\'y": "ý",
  "\"A": "Ä", // begin diaeresis
  "\"E": "Ë",
  "\"I": "Ï",
  "\"O": "Ö",
  "\"U": "Ü",
  "\"a": "ä",
  "\"e": "ë",
  "\"i": "ï",
  "\"o": "ö",
  "\"u": "ü",
  "~A": "Ã", // begin tilde
  "~N": "Ñ",
  "~O": "Õ",
  "~a": "ã",
  "~n": "ñ",
  "~o": "õ",
  "rU": "Ů", // begin ring above
  "ru": "ů",
  "vC": "Č",  // begin caron
  "vD": "Ď",
  "vE": "Ě",
  "vN": "Ň",
  "vR": "Ř",
  "vS": "Š",
  "vT": "Ť",
  "vZ": "Ž",
  "vc": "č",
  "vd": "ď",
  "ve": "ě",
  "vn": "ň",
  "vr": "ř",
  "vs": "š",
  "vt": "ť",
  "vz": "ž",
  "#": "#",  // begin special symbols
  "$": "$",
  "%": "%",
  "&": "&",
  "\\": "\\",
  "^": "^",
  "_": "_",
  "{": "{",
  "}": "}",
  "~": "~",
  "\"": "\"",
  "\\'": "’", // closing single quote
  "`": "‘", // opening single quote
  "AA": "Å", // begin non-ASCII letters
  "AE": "Æ",
  "O": "Ø",
  "aa": "å",
  "ae": "æ",
  "o": "ø",
  "ss": "ß",
  "textcopyright": "©",
  "textellipsis": "…",
  "textemdash": "—",
  "textendash": "–",
  "textregistered": "®",
  "texttrademark": "™",
  "alpha": "α", // begin greek alphabet
  "beta": "β",
  "gamma": "γ",
  "delta": "δ",
  "epsilon": "ε",
  "zeta": "ζ",
  "eta": "η",
  "theta": "θ",
  "iota": "ι",
  "kappa": "κ",
  "lambda": "λ",
  "mu": "μ",
  "nu": "ν",
  "xi": "ξ",
  "omicron": "ο",
  "pi": "π",
  "rho": "ρ",
  "sigma": "ς",
  "tau": "σ",
  "upsilon": "τ",
  "phi": "υ",
  "chi": "φ",
  "psi": "χ",
  "omega": "ψ"
}

class LatexToUTF8 {
  constructor() {
    this.uniToLatex = {}
    this.latexToUni = LATEX_TO_UNI

    for (var idx in this.latexToUni) {
      if (this.latexToUni[idx].length > this.maxLatexLength) {
        this.maxLatexLength = this.latexToUni[idx].length
      }
      this.uniToLatex[this.latexToUni[idx]] = idx
    }
  }
  longestEscapeMatch(value, pos) {
    let subStringEnd = pos + 1 + this.maxLatexLength <= value.length ?
    		               pos + 1 + this.maxLatexLength : value.length
    let subStr = value.substring(pos + 1, subStringEnd)
    while (subStr.length > 0) {
      if (subStr in this.latexToUni) {
        break
      }
      subStr = subStr.substring(0, subStr.length - 1)
    }
    return subStr
  }

  decodeLatex(value) {
    let newVal = ''
    let pos = 0
    while (pos < value.length) {
      if (value[pos] === '\\') {
        let match = this.longestEscapeMatch(value, pos)
        if (match.length > 0) {
          newVal += this.latexToUni[match]
          pos = pos + 1 + match.length
        } else {
          newVal += value[pos]
          pos++
        }
      } else if (value[pos] === '{' || value[pos] === '}') {
        pos++
      } else {
        newVal += value[pos]
        pos++
      }
    }
    return newVal
  }
}

const latexToUTF8 = new LatexToUTF8()

class BibtexParser {

  constructor(text) {
    this.months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    this.notKey = [',', '{', '}', ' ', '=']
    this.pos = 0
    this.input = ""
    this.entries = []
    this.currentEntry = {}
    this.input = text
  }

  getEntries() {
    return this.entries
  }

  isWhitespace(s) {
    return (s === ' ' || s === '\r' || s === '\t' || s === '\n')
  }

  match(s, canCommentOut) {
    if (canCommentOut === undefined || canCommentOut === null)
      canCommentOut = true
    this.skipWhitespace(canCommentOut)
    if (this.input.substring(this.pos, this.pos + s.length) === s) {
      this.pos += s.length
    } else {
      throw new TypeError("Token mismatch: match", "expected " + s + ", found " +
                        this.input.substring(this.pos))
    }
    this.skipWhitespace(canCommentOut)
  }

  tryMatch(s, canCommentOut) {
    if (canCommentOut === undefined || canCommentOut === null)
      canCommentOut = true
    this.skipWhitespace(canCommentOut)
    if (this.input.substring(this.pos, this.pos + s.length) === s) {
      return true
    }
    return false

    // this.skipWhitespace(canCommentOut);
  }

  /* when search for a match all text can be ignored, not just white space */
  matchAt() {
    while (this.input.length > this.pos && this.input[this.pos] != '@') {
      this.pos++
    }

    if (this.input[this.pos] == '@') {
      return true
    }
    return false
  }

  skipWhitespace(canCommentOut) {
    while (this.isWhitespace(this.input[this.pos])) {
      this.pos++
    }
    if (this.input[this.pos] === "%" && canCommentOut === true) {
      while (this.input[this.pos] !== "\n") {
        this.pos++
      }
      this.skipWhitespace(canCommentOut)
    }
  }

  value_comment() {
    let str = ''
    let brcktCnt = 0
    let start = this.pos
    while (!(this.tryMatch("}", false) && brcktCnt === 0)) {
      str += this.input[this.pos]
      if (this.input[this.pos] === '{')
        brcktCnt++
      if (this.input[this.pos] === '}')
        brcktCnt--
      if (this.pos >= this.input.length - 1) {
        throw new TypeError("Unterminated value: value_comment", Number(this.input.substring(start)))
      }
      this.pos++
    }
    return str
  }

  value_braces() {
    let bracecount = 0
    this.match("{", false)
    let start = this.pos
    let escaped = false
    while (true) {
      if (!escaped) {
        if (this.input[this.pos] === '}') {
          if (bracecount > 0) {
            bracecount--
          } else {
            var end = this.pos
            this.match("}", false)
            return this.input.substring(start, end)
          }
        } else if (this.input[this.pos] === '{') {
          bracecount++
        } else if (this.pos >= this.input.length - 1) {
          throw new TypeError("Unterminated value: value_braces")
        }
      }
      if (this.input[this.pos] === '\\' && escaped === false)
        escaped = true
      else
        escaped = false
      this.pos++
    }
  }

  value_quotes() {
    this.match('"', false)
    let start = this.pos
    let escaped = false
    while (true) {
      if (!escaped) {
        if (this.input[this.pos] === '"') {
          let end = this.pos
          this.match('"', false)
          return this.input.substring(start, end)
        } else if (this.pos >= this.input.length - 1) {
          throw new TypeError("Unterminated value: value_quotes", this.input.substring(start))
        }
      }
      if (this.input[this.pos] === '\\' && escaped === false)
        escaped = true
      else
        escaped = false
      this.pos++
    }
  }

  single_value() {
    let start = this.pos
    if (this.tryMatch("{")) {
      return this.value_braces()
    } else if (this.tryMatch('"')) {
      return this.value_quotes()
    }
    let k = this.key()
    if (k.match("[0-9]+"))
      return k
    else if (this.months.indexOf(k.toLowerCase()) >= 0)
      return k.toLowerCase()
    throw new TypeError("Value expected: single_value" + this.input.substring(start) + ' for key: ' + k)
  }

  value() {
    let values = []
    values.push(this.single_value())
    while (this.tryMatch("#")) {
      this.match("#")
      values.push(this.single_value())
    }

    // return latexToUTF8.decodeLatex(values.join(""));
    return values.join("")
  }

  key(optional) {
    let start = this.pos
    while (true) {
      if (this.pos >= this.input.length) {
        throw new TypeError("Runaway key: key")
      }
                                // а-яА-Я is Cyrillic
                // console.log(this.input[this.pos]);
                // if (this.input[this.pos].match(/[a-zA-Z0-9+_:\?\.\/\[\]\-]/)) {
                //   // Added question marks to handle Zotero going sideways. -APCS
                //   this.pos++;
                // } else {
      if (this.notKey.indexOf(this.input[this.pos]) >= 0) {
        if (optional && this.input[this.pos] !== ',') {
          this.pos = start
          return null
        }
        return this.input.substring(start, this.pos)
      }
      this.pos++
    }
  }

  key_equals_value() {
    // TODO add mechanism to quickly skip to next section
    // TODO maybe don't bother storing abstract fields
    let key = this.key()
    if (this.tryMatch("=")) {
      this.match("=")
      let val = this.value()
      key = key.trim().toLowerCase()
      // Only convert to UTF8 chars for title and author fields
      const convertFields = ['author', 'title', 'editor', 'in', 'journal', 'booktitle']
      if (convertFields.includes(key)) {
        // val = latexToUTF8.decodeLatex(val)
        val = latexUni.convertLaTeX({
          onError: (error, latex) => latexToUTF8.decodeLatex(val)
        },
        val)
      }
      // convert author and editor name lists to CSL-style structure
      const nameCleanupFields = ['author', 'editor']
      if (nameCleanupFields.includes(key)) {
        val = this.cleanAuthors(val.split(' and '))
      }

      return {key: key, val: val}
    }
    throw new TypeError("Value expected, equals sign missing: key_equals_value",
                     this.input.substring(this.pos))
  }

  key_value_list() {
    let {key, val} = this.key_equals_value()
    if (key !== 'id') {
      this.currentEntry[key] = val
    }
    while (this.tryMatch(",")) {
      this.match(",")
      // fixes problems with commas at the end of a list
      if (this.tryMatch("}")) {
        break
      }
      let {key, val} = this.key_equals_value()
      if (key !== 'id') {
        this.currentEntry[key] = val
      }
    }
  }

  entry_body(d) {
    this.currentEntry = {}
    this.currentEntry.id = this.key(true)
    this.currentEntry.type = d.substring(1)
    if (this.currentEntry.id !== null) {
      this.match(",")
    }
    this.key_value_list()
    this.entries.push(this.currentEntry)
  }

  directive() {
    this.match("@")
    return "@" + this.key()
  }

  preamble() {
    // Need to parse the entry to move the current parser position,
    // but don't store the results
    let entry = this.value_comment()
    this.currentEntry = {}
    // this.currentEntry.type = 'PREAMBLE';
    // this.currentEntry.entry = entry;
    // this.entries.push(this.currentEntry);
  }

  comment() {
    // Need to parse the entry to move the current parser position,
    // but don't store the results
    let entry = this.value_comment()
    this.currentEntry = {}
    // this.currentEntry.type = 'COMMENT';
    // this.currentEntry.entry = entry;
    // this.entries.push(this.currentEntry);
  }

  entry(d) {
    this.entry_body(d)
  }

  alernativeid() {
    this.entries.forEach(function(entry) {
      if (!entry.id && (entry.author || entry.year)) {
        entry.id = ''
        if (entry.author) {
          entry.id += entry.author.split(',')[0] += ', '
        }
        entry.id += entry.year
      }
    })
  }

  cleanAuthors(authors) {
    if ((!authors)) {
      return [{family: 'Unknown'}]
    }
    const result = []

    for (let author of authors) {
      let [family, given] =
          Array.from(author.indexOf(', ') !== -1 ? author.split(', ') : [author])

      result.push({given, family})
    }
    return result
  }

  /*
  Run the bibtex file parsing
  */
  parse() {
    while (this.matchAt()) {
      var d = this.directive()
      this.match("{")
      // NOTE: although we have to parse string preamble, comment to get to the next bit of the bibtex
      // file, don't bother adding them to the structure
      if (d.toUpperCase() === "@STRING") {
        this.string()
      } else if (d.toUpperCase() === "@PREAMBLE") {
        this.preamble()
      } else if (d.toUpperCase() === "@COMMENT") {
        this.comment()
      } else {
        this.entry(d)
      }
      this.match("}")
    }

    this.alernativeid()
  }
}

function toJSON(bibtex) {
  var b = new BibtexParser(bibtex)
  b.parse()
  return b.entries
}

onmessage = function(bibtexStr) {
  let bibtex = toJSON(bibtexStr.data)
  bibtex = enhanceReferences(bibtex)
  postMessage(bibtex)
}
