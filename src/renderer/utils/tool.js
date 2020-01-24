const path = require('path')
const fs = require('fs')

function readFileList (dir, filesList = [], extension) {
  const files = fs.readdirSync(dir)
  files.forEach((item, index) => {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      readFileList(path.join(dir, item), filesList, extension)
    } else {
      const extname = path.extname(fullPath)
      if (new RegExp(`.${extension}$`, 'i').test(extname)) {
        filesList.push(fullPath)
      }
    }
  })
  return filesList
}

export const getAllFiles = (paths, extension) => {
  const fileList = []
  paths.forEach(filePath => {
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      fileList.push(...readFileList(filePath, [], extension))
    } else {
      const extname = path.extname(filePath)
      if (new RegExp(`.${extension}$`, 'i').test(extname)) {
        fileList.push(filePath)
      }
    }
  })
  return fileList
}
