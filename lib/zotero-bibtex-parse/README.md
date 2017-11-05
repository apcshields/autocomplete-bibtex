zotero-bibtex-parse
=============
A JavaScript library that parses (Zotero-flavored) BibTeX parser. Forked from ORCID's
[bibtexParseJs](https://github.com/ORCID/bibtexParseJs).

There are very few differences from ORCID's version, made for compatibility with the BibTeX output provided by Zotero's built-in BibTeX translator and [Robin Wilson's adaptation](http://www.rtwilson.com/academic/autozotbib) of [spartanroc's BibTeX translator](https://gist.github.com/spartanroc/956623), namely:

1. Re-introduction of Mikola Lysenko's support for unquoted and unbracketed month-name abbreviations (which seems to be standard Bibtex).
2. Support for entries the type of which Zotero doesn't know and which are therefore labeled as '????', '????-1', etc. (which I doubt is BibTeX at all).

I've tested these changes in Node.js against a small BibTeX file (30 entries) of very varied citations. File an [issue](https://github.com/apcshields/zotero-bibtex-parse/issues) if you find something I've missed.

## Using in Browser
Include zotero-bibtex-parse.js and call

```
bibtexParse.toJSON('@article{sample1,title={sample title}}');
```

## Using in [Node.js](http://nodejs.org/)
Install     ```npm install zotero-bibtex-parse```

```
var bibtexParse = require('zotero-bibtex-parse');

var sample = bibtexParse.toJSON('@article{sample1,title={sample title}}');

console.log(sample);
```

**Returns** A parsed BibTeX file as a JSON Array Object

```
[ { citationKey: 'SAMPLE1',
    entryType: 'ARTICLE',
    entryTags: { TITLE: 'sample title' } } ]
```

## Contributing
Contributions are welcome. Please make sure the unit test(test/runTest.js) reflects the changes and completes successfully.


## Credits
(c) 2010 Henrik Muehe. (MIT License)
[visit](https://code.google.com/p/bibtex-js/)


CommonJS port maintained by Mikola Lysenko
[visit](https://github.com/mikolalysenko/bibtex-parser)

Lightly modified from ORCID's (rcpeter's) adaptation.
