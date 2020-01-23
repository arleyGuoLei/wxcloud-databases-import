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
