'use babel'
const fs = require('fs')
const util = require('./util')

// const chokidar = require('chokidar')

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout
	return function() {
		var context = this, args = arguments
		var later = function() {
			timeout = null
			if (!immediate) func.apply(context, args)
		}
		var callNow = immediate && !timeout
		clearTimeout(timeout)
		timeout = setTimeout(later, wait)
		if (callNow) func.apply(context, args)
	};
};


export default class AbstractReader {
  constructor(file) {
    this.handleWatchFileEvent = this.handleWatchFileEvent.bind(this)
    this.update = this.update.bind(this)
    this.interruptUpdate = this.interruptUpdate.bind(this)
    this.watchFile = this.watchFile.bind(this)
    this.file = file
    this.lastStat = fs.statSync(file)
    this.watchFile()
  }

  async read() {
    throw new Error('Not implemented')
  }

  update() {
    this.references = this.read()
  }

  interruptUpdate() {

  }

  async handleWatchFileEvent(eventType, filename) {
    if (eventType === 'rename') {
      // during rename events, file might be completely or temporarily deleted
      // need to handle both cases. If only temporarily deleted should retry up to a point.
			this.watch.close()
			this.watchFile()
    }
    console.log(eventType);

    // Note: because writers might update files by both altering their contents (change)
    // or completely replacing them, basically any event type for the watched file should
    // trigger a re-read
    try {
      let newStat = await util.waitWriteComplete(this.file)
      if (newStat.mtime.getTime() !== this.lastStat.mtime.getTime()) {
        this.interruptUpdate()
        this.references = this.read()
        this.lastStat = newStat
      }
    }
    catch (err) {
      console.log(err)
    }
  }

  watchFile() {
    let handler = debounce(this.handleWatchFileEvent, 2000)
    this.watch = fs.watch(this.file, handler)
  }

  close() {
    this.watch.close()
  }
}
