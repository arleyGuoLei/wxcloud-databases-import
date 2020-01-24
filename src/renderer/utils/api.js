const fs = require('fs')

export const getAccessToken = (appid, secret) => {
  return {
    method: 'get',
    url: 'https://api.weixin.qq.com/cgi-bin/token',
    params: {
      grant_type: 'client_credential',
      appid,
      secret
    }
  }
}

export const getUploadFileInfo = (accessToken, env, path) => {
  return {
    method: 'POST',
    url: 'https://api.weixin.qq.com/tcb/uploadfile',
    params: {
      access_token: accessToken
    },
    data: {
      env,
      path
    }
  }
}

export const uploadFile = (url, requestPath, authorization, token, fileId, path) => {
  const file = fs.readFileSync(path, 'utf-8')
  let formData = new FormData()
  formData.append('key', requestPath)
  formData.append('Signature', authorization)
  formData.append('x-cos-security-token', token)
  formData.append('x-cos-meta-fileid', fileId)
  formData.append('file', file)

  return {
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
}

export const databaseMigrateImport = (accessToken, env, collectionName, filePath, fileType, stopOnError, conflictMode) => {
  return {
    method: 'POST',
    url: 'https://api.weixin.qq.com/tcb/databasemigrateimport',
    params: {
      access_token: accessToken
    },
    data: {
      env,
      collection_name: collectionName,
      file_path: filePath,
      file_type: fileType === 'JSON' ? 1 : 2,
      stop_on_error: stopOnError,
      conflict_mode: conflictMode === 'INSERT' ? 1 : 2
    }
  }
}
