// TODO this is not used yet!

'use babel'

const fs = require('fs')
// const chokidar = require('chokidar')

export default class AbstractReader {
  constructor(file) {
    this.update = this.update.bind(this)
    this.interrruptUpdate = this.interrruptUpdate.bind(this)
    this.watchFile = this.watchFile.bind(this)

    this.file = file
  }

  async read() {
    throw new Error('Not implemented')
  }

  update() {
    this.references = this.read()
  }

  interruptUpdate() {

  }

  watchFile(file) {
    this.watch = fs.watch(file,  (eventType, filename) => {

      // Note: because writers might update files by both altering their contents (change)
      // or completely replacing them, basically any event type for the watched file should
      // trigger a re-read
      let stat = fs.statSync(file);

      checkWriteComplete(file, stat,
        () => {
        this.references = this.read()
      }, (err) => {
        throw err
      })
    })


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
