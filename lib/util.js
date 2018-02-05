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

function stat(file) {
  return new Promise((resolve, reject) => {
    fs.stat(file, (err, stat) => {
      if (err !== null) return reject(err)
      resolve(stat)
    })
  })
}

function asyncSleep(milliseconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(milliseconds)
    }, milliseconds)
  })
}

/**
 * Async function to wait until a file's size stops changing
 * Works by returning a promise that polls the file size asynchronously
 * and resolves when the file size doesn't change between polls.
 */
async function waitWriteComplete(file) {
  let prevStat = await stat(file)
  let newStat
  let sleepy
  let fileWritten = false
  let i = 0
  while (!fileWritten) {
    i += 1
    newStat = await stat(file)
    if (newStat.size !== 0 && newStat.size === prevStat.size) {
      fileWritten = true
      return newStat
    } else {
      sleepy = await asyncSleep(1000)
      console.log(sleepy);
      prevStat = newStat
    }
  }
  // TODO should raise error here
}

module.exports = {readFile, stat, checkWriteComplete, waitWriteComplete}
