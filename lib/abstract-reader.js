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
    // Note: because writers might update files by both altering their contents (change)
    // or completely replacing them, basically any event type for the watched file should
    // trigger a re-read
    await util.waitWriteComplete(this.file)
    this.interruptUpdate()
    this.references = this.read()
  }

  watchFile() {
    this.watch = fs.watch(this.file, this.handleWatchFileEvent)
    // let watch = fs.watch(file,  (eventType, filename) => {
    //
    //   // Note: because writers might update files by both altering their contents (change)
    //   // or completely replacing them, basically any event type for the watched file should
    //   // trigger a re-read
    //   let stat = fs.statSync(file);
    //
    //   util.checkWriteComplete(file, stat,
    //     () => {
    //       this.interruptUpdate()
    //       this.references = this.read()
    //     }, (err) => {
    //       throw err
    //     }
    //   )
    // })

    // chokidar.watch(file, {
    //   persistent: true,
    //   awaitWriteFinish: true,
    //   disableGlobbing: true
    // }).on('change', (eventType, filename) => {
    //   this.interruptUpdate()
    //   this.update()
    // }).on('add', (eventType, filename) => {
    //   // this.update()
    // }).on('unlink', (eventType, filename) => {
    //   this.watch.close()
    // })
  }
}
