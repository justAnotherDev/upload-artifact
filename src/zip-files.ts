import * as core from '@actions/core'
import path = require('path')
import fs = require('fs')
import archiver = require('archiver')

export async function zip(files, name): Promise<void> {
  const archive = archiver('zip')
  const stream = fs.createWriteStream(`${name}.zip`)
  return new Promise((resolve, reject) => {
    archive.on('error', err => reject(err)).pipe(stream)
    files.forEach(filePath => {
      console.log(
        `adding path: ${path} relative: ${path.relative(process.cwd(), filePath)} as ${path.basename(filePath)}`
      )
      archive.file(path.relative(process.cwd(), filePath), path.basename(filePath))
    })
    stream.on('close', () => {
      core.info('closed')
      resolve()
    })
    archive.finalize()
  })
}
