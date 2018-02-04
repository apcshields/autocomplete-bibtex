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

function statFile(file) {
  return new Promise((resolve, reject) => {
    fs.stat(file, (err, stat) => {
      if (err !== null) return reject(err)
      resolve(stat)
    })
  })
}

// function checkFileCopyComplete(path, prevStat) {
//     fs.stat(path, function (err, stat) {
//
//         if (err) {
//             throw err;
//         }
//
//         // if (stat.mtime.getTime() === prevStat.mtime.getTime()) {
//         if (stat.size === prevStat.size) {
//
//             //-------------------------------------
//             // CALL A FUNCTION TO PROCESS FILE HERE
//             //-------------------------------------
//         }
//         else {
//             setTimeout(checkFileCopyComplete, 500, path, stat);
//         }
//     });
// }

function checkWriteComplete(path, prevStat, callback, errcallback) {
  fs.stat(path, (err, stat) => {
    if (err) {
      errcallback(err)
    }

        // if (stat.mtime.getTime() === prevStat.mtime.getTime()) {
    if (stat.size === prevStat.size) {
      callback(path, stat)
    } else {
      setTimeout(checkWriteComplete, 500, path, stat, callback)
    }
  })
}

/**
 * Async function to wait until a file's size stops changing
 * Works by returning a promise that polls the file size asynchronously
 * and resolves when the file size doesn't change between polls.
 */
function waitWriteComplete(file) {
  // let stat = fs.statSync(path);   await stat = util.statFile(this.file);

  new Promise((resolve, reject) => {
    fs.stat(file, (err, stat) => {
      if (err !== null) {
        reject(err)
      }

      checkWriteComplete(file, stat,
        (file, stat) => {
          resolve(true)
        },
      err => {
        reject(err)
      })
    })
  })
}

module.exports = {readFile, statFile, checkWriteComplete, waitWriteComplete}
