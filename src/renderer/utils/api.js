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

// https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/database/databaseMigrateQueryInfo.html
export const databaseMigrateQueryInfo = (accessToken, env, jobId) => {
  return {
    method: 'POST',
    url: 'https://api.weixin.qq.com/tcb/databasemigratequeryinfo',
    params: {
      access_token: accessToken
    },
    data: {
      env,
      job_id: jobId
    }
  }
}

// https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/database/databaseDelete.html
export const batchDeleteFile = (accessToken, env, fileId) => {
  return {
    method: 'POST',
    url: 'https://api.weixin.qq.com/tcb/batchdeletefile',
    params: {
      access_token: accessToken
    },
    data: {
      env,
      fileid_list: [fileId]
    }
  }
}

// https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/database/databaseCollectionAdd.html
export const databaseCollectionAdd = (accessToken, env, collectionName) => {
  return {
    method: 'POST',
    url: 'https://api.weixin.qq.com/tcb/databasecollectionadd',
    params: {
      access_token: accessToken
    },
    data: {
      env,
      collection_name: collectionName
    }
  }
}
