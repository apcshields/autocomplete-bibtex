'use babel'
const fs = require('fs')
const util = require('./util')
// const chokidar = require('chokidar')

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
    console.log(eventType);
    // TODO cache modified time
    // Note: because writers might update files by both altering their contents (change)
    // or completely replacing them, basically any event type for the watched file should
    // trigger a re-read
    let newStat =  await util.waitWriteComplete(this.file)
    if (newStat.mtime.getTime() !== this.lastStat.mtime.getTime()) {
      this.interruptUpdate()
      this.references = this.read()
      this.lastStat = newStat
    }
  }

  watchFile() {
    this.watch = fs.watch(this.file, this.handleWatchFileEvent)
  }
}
