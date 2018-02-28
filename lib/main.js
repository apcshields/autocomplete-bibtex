'use babel'

const fs = require("fs")
const {CompositeDisposable} = require('atom')

const ReferenceProvider = require("./provider")
const RefView = require('./ref-view')

module.exports = {
  config: {
    bibtex: {
      type: 'array',
      default: [],
      items: {
        type: 'string'
      }
    },
    scope: {
      type: 'string',
      default: '.source.gfm,.text.md'
    },
    ignoreScope: {
      type: 'string',
      default: '.comment'
    },
    resultTemplate: {
      type: 'string',
      default: '@[key]'
    }
  },

  activate(state) {
    let reload = false
    if (state) {
      this.saveTime = state.saveTime
      const bibliographyFiles = atom.config.get("autocomplete-bibtex.bibtex")
      // reload everything if any files changed since serialisation
      for (let file of Array.from(bibliographyFiles)) {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file)
          if (stats.isFile() && (state.saveTime < stats.mtime.getTime())) {
            reload = true
            this.saveTime = new Date().getTime()
            break
          }
        }
      }
    }

    // if (state && (reload === false)) {
    //   this.provider = atom.deserializers.deserialize(state.provider)
    //   // deserializer produces "undefined" if it fails, so double check
    //   if (!this.provider) {
    //     this.provider = new ReferenceProvider()
    //   }
    // } else {
    this.provider = new ReferenceProvider()
    // }

    // this.refView = new RefView(this.provider)

    this.commands = new CompositeDisposable()

    // TODO figure out how to show/hide commands for grammars
    return this.commands.add(atom.commands.add('atom-workspace', {
      'bibliography:search': () => this.showSearch(),
      'bibliography:reload': () => this.forceReload()
    })
    )
  },

  showSearch() {
    let refView = new RefView(this.provider)
    refView.show()
  },

  forceReload() {
    // Creating new object breaks link with autocompleter
    this.provider.reload()
  },

  deactivate() {
    this.provider.dispose()
    this.commands.dispose()
  },
  //
  // serialize() {
  //   const state = {
  //     provider: this.provider.serialize(),
  //     saveTime: new Date().getTime()
  //   }
  //   return state
  // },

  provide() {
    return this.provider
  }
}
