import * as core from '@actions/core'
import {create, UploadOptions} from '@actions/artifact'
import {findFilesToUpload} from './search'
import {getInputs} from './input-helper'
import {NoFileOptions} from './constants'
import {zip} from './zip-files'

async function run(): Promise<void> {
  try {
    const inputs = getInputs()
    let searchResult = await findFilesToUpload(inputs.searchPath)
    if (searchResult.filesToUpload.length === 0) {
      // No files were found, different use cases warrant different types of behavior if nothing is found
      switch (inputs.ifNoFilesFound) {
        case NoFileOptions.warn: {
          core.warning(
            `No files were found with the provided path: ${inputs.searchPath}. No artifacts will be uploaded.`
          )
          break
        }
        case NoFileOptions.error: {
          core.setFailed(
            `No files were found with the provided path: ${inputs.searchPath}. No artifacts will be uploaded.`
          )
          break
        }
        case NoFileOptions.ignore: {
          core.info(
            `No files were found with the provided path: ${inputs.searchPath}. No artifacts will be uploaded.`
          )
          break
        }
      }
    } else {
      core.info(
        `With the provided path, there will be ${searchResult.filesToUpload.length} file(s) uploaded`
      )
      core.debug(`Root artifact directory is ${searchResult.rootDirectory}`)

      // If requested, zip the files
      if (inputs.zip) {
        await zip(searchResult.filesToUpload, inputs.artifactName)
        searchResult = {
          filesToUpload: [`${inputs.artifactName}.zip`],
          rootDirectory: process.cwd()
        }
        core.info(
          `Uploading ${searchResult.filesToUpload.length} file(s) from ${searchResult.rootDirectory}`
        )
      }

      const artifactClient = create()
      const options: UploadOptions = {
        continueOnError: false
      }
      const uploadResponse = await artifactClient.uploadArtifact(
        inputs.artifactName,
        searchResult.filesToUpload,
        searchResult.rootDirectory,
        options
      )

      if (uploadResponse.failedItems.length > 0) {
        core.setFailed(
          `An error was encountered when uploading ${uploadResponse.artifactName}. There were ${uploadResponse.failedItems.length} items that failed to upload.`
        )
      } else {
        core.info(
          `Artifact ${uploadResponse.artifactName} has been successfully uploaded!`
        )
      }
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

run()
