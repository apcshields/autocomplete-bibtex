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
  let prevStat
  let newStat
  let max_tries = 10
  let tries = 0

  try {
    prevStat = await stat(file)
  }
  catch (err) {
    console.log(err);
    prevStat = {size: 0}
  }

  while (tries <= max_tries) {
    tries += 1
    await asyncSleep(1000)

    try {
      newStat = await stat(file)
    }
    catch (err) {
      console.log(err);
      prevStat = {size: 0}
    }

    if (newStat.size !== 0 && newStat.size === prevStat.size) {
      return newStat
    } else {
      prevStat = newStat
    }
  }
  // TODO should raise error here
}

module.exports = {readFile, stat, waitWriteComplete}
