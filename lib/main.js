/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs = require("fs");
const {CompositeDisposable} = require('atom');

const ReferenceProvider = require("./provider");
const RefView = require('./ref-view');

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
    let reload = false;
    if (state) {
      this.saveTime = state.saveTime;
      const bibliographyFiles = atom.config.get("autocomplete-bibtex.bibtex");
      // reload everything if any files changed since serialisation
      for (let file of Array.from(bibliographyFiles)) {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          if (stats.isFile()) {
            if (state.saveTime < stats.mtime.getTime()) {
              reload = true;
              this.saveTime = new Date().getTime();
            }
          }
        }
      }
    }

    if (state && (reload === false)) {
      this.provider = atom.deserializers.deserialize(state.provider);
      // deserializer produces "undefined" if it fails, so double check
      if (!this.provider) {
        this.provider = new ReferenceProvider();
      }
    } else {
      this.provider = new ReferenceProvider();
    }

    this.refView = new RefView(this.provider.references);

    this.commands = new CompositeDisposable();

    // TODO figure out how to show/hide commands for grammars
    return this.commands.add(atom.commands.add('atom-workspace', {
      'bibliography:search': () => this.showSearch(),
      'bibliography:reload': () => this.forceReload()
    }
    )
    );
  },

  showSearch() {
    // @refView = new RefView(@referenceProvider.references)
    return this.refView.show();
  },

  forceReload() {
    this.provider = new ReferenceProvider();
    // TODO should be able to 'update' underlying selectlist with new data
    this.refView = new RefView(this.provider.references);
  },

    // @commands = new CompositeDisposable()
    //
    // # TODO figure out how to show/hide commands for grammars
    // @commands.add atom.commands.add 'atom-workspace',
    //     'bibliography:search': => @showSearch()
    //     'bibliography:reload': => @forceReload()

  deactivate() {
    return this.commands.dispose();
  },

  serialize() {
    const state = {
      provider: this.provider.serialize(),
      saveTime: new Date().getTime()
    };
    return state;
  },

  provide() {
    return this.provider;
  }
};
