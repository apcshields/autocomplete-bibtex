// TODO this is not used yet!

'use babel'

const chokidar = require('chokidar')

export default class AbstractReader {
  constructor() {
    this.fileCopyDelaySeconds = 0.5
    this.update = this.update.bind(this)
    this.interrruptUpdate = this.interrruptUpdate.bind(this)
    this.watchFile = this.watchFile.bind(this)
  }

  async read() {
    throw new Error('Not implemented')
  }

  update() {
    this.references = this.read()
  }

  interrruptUpdate() {

  }

  watchFile(file) {
    this.watch = chokidar.watch(file, {
      persistent: true,
      awaitWriteFinish: true,
      disableGlobbing: true
    }).on('change', (eventType, filename) => {
      this.interruptUpdate()
      this.update()
    }).on('add', (eventType, filename) => {
      // this.update()
    }).on('unlink', (eventType, filename) => {
      this.watch.close()
    })
  }
}
