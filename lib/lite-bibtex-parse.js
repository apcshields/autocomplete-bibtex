'use babel';
/* start bibtexParse 0.0.24 */

// Original work by Henrik Muehe (c) 2010
//
// CommonJS port by Mikola Lysenko 2013
//
// Choice of compact (default) or pretty output from toBibtex:
//		Nick Bailey, 2017.
//
// Port to Browser lib by ORCID / RCPETERS
//
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
};

class LatexToUTF8 {
  constructor() {
    this.uniToLatex = {};
    this.latexToUni = LATEX_TO_UNI;

      // String.prototype.addSlashes() {
      //       // no need to do (str+'') anymore because 'this' can only be a string
      //   return this.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
      // };

    for (var idx in this.latexToUni) {
      if (this.latexToUni[idx].length > this.maxLatexLength) {
        this.maxLatexLength = this.latexToUni[idx].length;
      }
      this.uniToLatex[this.latexToUni[idx]] = idx;
    }
  }
  longestEscapeMatch(value, pos) {
    let subStringEnd = pos + 1 + this.maxLatexLength <= value.length ?
    		               pos + 1 + this.maxLatexLength : value.length;
    let subStr = value.substring(pos + 1, subStringEnd);
    while (subStr.length > 0) {
      if (subStr in this.latexToUni) {
        break;
      }
      subStr = subStr.substring(0, subStr.length - 1);
    }
    return subStr;
  }

  decodeLatex(value) {
    var newVal = '';
    var pos = 0;
    while (pos < value.length) {
      if (value[pos] === '\\') {
        var match = this.longestEscapeMatch(value, pos);
        if (match.length > 0) {
          newVal += this.latexToUni[match];
          pos = pos + 1 + match.length;
        } else {
          newVal += value[pos];
          pos++;
        }
      } else if (value[pos] == '{' || value[pos] == '}') {
        pos++;
      } else {
        newVal += value[pos];
        pos++;
      }
    }
    return newVal;
  }

  encodeLatex(value) {
    var trans = '';
    for (var idx = 0; idx < value.length; ++idx) {
      var c = value.charAt(idx);
      if (c in this.uniToLatex)
    		            trans += '\\' + this.uniToLatex[c];
    		        else
    		           trans += c;
    		   }
    		   return trans;
  }
  }

const latexToUTF8 = new LatexToUTF8();

function replaceLatex(str) {
  str = str.replace('{', '');
  str = str.replace('}', '');

  for (let replacers of Object.entries(LATEX_TO_UNI)){
    str = str.replace(replacers[0], replacers[1]);
  }
  return str;
}

class BibtexParser {

  constructor() {
    this.months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    this.notKey = [',', '{', '}', ' ', '='];
    this.pos = 0;
    this.input = "";
    this.entries = [];

    this.currentEntry = "";
  }

  setInput(t) {
    this.input = t;
  }

  getEntries() {
    return this.entries;
  }

  isWhitespace(s) {
    return (s == ' ' || s == '\r' || s == '\t' || s == '\n');
  }

  match(s, canCommentOut) {
    if (canCommentOut == undefined || canCommentOut == null)
      canCommentOut = true;
    this.skipWhitespace(canCommentOut);
    if (this.input.substring(this.pos, this.pos + s.length) == s) {
      this.pos += s.length;
    } else {
      throw TypeError("Token mismatch: match", "expected " + s + ", found " +
                        this.input.substring(this.pos));
    }
    this.skipWhitespace(canCommentOut);
  }

  tryMatch(s, canCommentOut) {
    if (canCommentOut == undefined || canCommentOut == null)
      canCommentOut = true;
    this.skipWhitespace(canCommentOut);
    if (this.input.substring(this.pos, this.pos + s.length) === s) {
      return true;
    }
    return false;

    this.skipWhitespace(canCommentOut);
  }

        /* when search for a match all text can be ignored, not just white space */
  matchAt() {
    while (this.input.length > this.pos && this.input[this.pos] != '@') {
      this.pos++;
    }

    if (this.input[this.pos] == '@') {
      return true;
    }
    return false;
  }

  skipWhitespace(canCommentOut) {
    while (this.isWhitespace(this.input[this.pos])) {
      this.pos++;
    }
    if (this.input[this.pos] == "%" && canCommentOut == true) {
      while (this.input[this.pos] != "\n") {
        this.pos++;
      }
      this.skipWhitespace(canCommentOut);
    }
  }

  value_braces() {
    var bracecount = 0;
    this.match("{", false);
    var start = this.pos;
    var escaped = false;
    while (true) {
      if (!escaped) {
        if (this.input[this.pos] == '}') {
          if (bracecount > 0) {
            bracecount--;
          } else {
            var end = this.pos;
            this.match("}", false);
            return this.input.substring(start, end);
          }
        } else if (this.input[this.pos] == '{') {
          bracecount++;
        } else if (this.pos >= this.input.length - 1) {
          throw TypeError("Unterminated value: value_braces");
        }
      }
      if (this.input[this.pos] == '\\' && escaped == false)
        escaped = true;
      else
                    escaped = false;
      this.pos++;
    }
  }

  value_comment() {
    var str = '';
    var brcktCnt = 0;
    while (!(this.tryMatch("}", false) && brcktCnt == 0)) {
      str += this.input[this.pos];
      if (this.input[this.pos] == '{')
        brcktCnt++;
      if (this.input[this.pos] == '}')
        brcktCnt--;
      if (this.pos >= this.input.length - 1) {
        throw TypeError("Unterminated value: value_comment", Number(this.input.substring(start)));
      }
      this.pos++;
    }
    return str;
  }

  value_quotes() {
    this.match('"', false);
    var start = this.pos;
    var escaped = false;
    while (true) {
      if (!escaped) {
        if (this.input[this.pos] == '"') {
          var end = this.pos;
          this.match('"', false);
          return this.input.substring(start, end);
        } else if (this.pos >= this.input.length - 1) {
          throw new TypeError("Unterminated value: value_quotes", this.input.substring(start));
        }
      }
      if (this.input[this.pos] == '\\' && escaped == false)
        escaped = true;
      else
                    escaped = false;
      this.pos++;
    }
  }

  single_value() {
    var start = this.pos;
    if (this.tryMatch("{")) {
      return this.value_braces();
    } else if (this.tryMatch('"')) {
      return this.value_quotes();
    }
    var k = this.key();
    if (k.match("^[0-9]+$"))
      return k;
    else if (this.months.indexOf(k.toLowerCase()) >= 0)
      return k.toLowerCase();
    throw new TypeError("Value expected: single_value" + this.input.substring(start) + ' for key: ' + k);
  }

  value() {
    var values = [];
    values.push(this.single_value());
    while (this.tryMatch("#")) {
      this.match("#");
      values.push(this.single_value());
    }

    // return latexToUTF8.decodeLatex(values.join(""));
    // return replaceLatex(values.join(""))
    return values.join("");
  }

  key(optional) {
    var start = this.pos;
    while (true) {
      if (this.pos >= this.input.length) {
        throw TypeError("Runaway key: key");
      }
                                // а-яА-Я is Cyrillic
                // console.log(this.input[this.pos]);
                // if (this.input[this.pos].match(/[a-zA-Z0-9+_:\?\.\/\[\]\-]/)) {
                //   // Added question marks to handle Zotero going sideways. -APCS
                //   this.pos++;
                // } else {
      if (this.notKey.indexOf(this.input[this.pos]) >= 0) {
        if (optional && this.input[this.pos] != ',') {
          this.pos = start;
          return null;
        }
        return this.input.substring(start, this.pos);
      }
      this.pos++;
    }
  }

  key_equals_value() {
    var key = this.key();
    if (this.tryMatch("=")) {
      this.match("=");
      var val = this.value();
      key = key.trim();
      return [key, val];
    }
    throw TypeError("Value expected, equals sign missing: key_equals_value",
                     this.input.substring(this.pos));
  }

  key_value_list() {
    var kv = this.key_equals_value();
    this.currentEntry.entryTags = {};
    this.currentEntry.entryTags[kv[0]] = kv[1];
    while (this.tryMatch(",")) {
      this.match(",");
                // fixes problems with commas at the end of a list
      if (this.tryMatch("}")) {
        break;
      }

      kv = this.key_equals_value();
      this.currentEntry.entryTags[kv[0]] = kv[1];
    }
  }

  entry_body(d) {
    this.currentEntry = {};
    this.currentEntry.citationKey = this.key(true);
    this.currentEntry.type = d.substring(1);
    if (this.currentEntry.citationKey != null) {
      this.match(",");
    }
    this.key_value_list();
    this.entries.push(this.currentEntry);
  }

  directive() {
    this.match("@");
    return "@" + this.key();
  }

  preamble() {
    this.currentEntry = {};
    this.currentEntry.type = 'PREAMBLE';
    this.currentEntry.entry = this.value_comment();
    this.entries.push(this.currentEntry);
  }

  comment() {
    this.currentEntry = {};
    this.currentEntry.type = 'COMMENT';
    this.currentEntry.entry = this.value_comment();
    this.entries.push(this.currentEntry);
  }

  entry(d) {
    this.entry_body(d);
  }

  alernativeCitationKey() {
    this.entries.forEach(function(entry) {
      if (!entry.citationKey && entry.entryTags) {
        entry.citationKey = '';
        if (entry.entryTags.author) {
          entry.citationKey += entry.entryTags.author.split(',')[0] += ', ';
        }
        entry.citationKey += entry.entryTags.year;
      }
    });
  }

  bibtex() {
    while (this.matchAt()) {
      var d = this.directive();
      this.match("{");
      if (d.toUpperCase() === "@STRING") {
        this.string();
      } else if (d.toUpperCase() === "@PREAMBLE") {
        this.preamble();
      } else if (d.toUpperCase() === "@COMMENT") {
          // this.comment();
          // don't do anything with comments
      } else {
        this.entry(d);
      }
      this.match("}");
    }

    this.alernativeCitationKey();
  }
  }

function toJSON(bibtex) {
  var b = new BibtexParser();
  b.setInput(bibtex);
  b.bibtex();
  return b.entries;
}

    /* added during hackathon don't hate on me */
    /* Increased the amount of white-space to make entries
     * more attractive to humans. Pass compact as false
     * to enable */
function toBibtex(json, compact = true) {
  var out = '';

  var entrysep = ',';
  var indent = '';
  if (!compact) {
		      entrysep = ',\n';
		      indent = '    ';
  }
  for (var i in json) {
    out += "@" + json[i].type;
    out += '{';
    if (json[i].citationKey)
      out += json[i].citationKey + entrysep;
    if (json[i].entry)
      out += json[i].entry;
    if (json[i].entryTags) {
      var tags = indent;
      for (var jdx in json[i].entryTags) {
        if (tags.trim().length != 0)
          tags += entrysep + indent;
        tags += jdx + (compact ? '={' : ' = {') +
                            json[i].entryTags[jdx] + '}';
      }
      out += tags;
    }
    out += compact ? '}\n' : '\n}\n\n';
  }
  return out;
}

export {toJSON, toBibtex, BibtexParser};
/* end bibtexParse */
