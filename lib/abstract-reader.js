// TODO this is not used yet!

'use babel'

const chokidar = require('chokidar')

export default class AbstractReader {
  constructor() {
    this.fileCopyDelaySeconds = 0.5
  }

  update() {
    throw new Error('Must override update method')
  }

  watchFile(file) {
    let watch = chokidar.watch(file, {
      persistent: true,
      awaitWriteFinish: true,
      disableGlobbing: true
    }).on('change', (eventType, filename) => {
      this.update()
    }).on('add', (eventType, filename) => {
      // this.update()
    }).on('unlink', (eventType, filename) => {
      watch.close()
    })
  }
}
