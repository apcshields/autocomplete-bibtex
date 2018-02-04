'use babel'

const fs = require("fs")

/**
 * 
 */
function readFile(file, opts) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, opts, (err, data) => {
      if (err !== null) return reject(err)
      resolve(data)
    })
  })
}

module.export = {readFile}
