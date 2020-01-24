import axios from 'axios'
import { getAccessToken } from '@/utils/api.js'

const state = {
  appid: '',
  secret: '',
  accessToken: '',
  createTime: 0,
  expiresIn: 0
}

const mutations = {
  UPDATE_ACCESSTOKEN (state, data) {
    const { appid, secret, accessToken, createTime, expiresIn } = data
    state.appid = appid
    state.secret = secret
    state.accessToken = accessToken
    state.createTime = createTime
    state.expiresIn = expiresIn
  }
}

const actions = {
  async login ({ commit, state }, { appid, secret }) {
    let { createTime, expiresIn, accessToken } = state
    try {
      if (Date.now() - createTime >= expiresIn || !accessToken) {
        const { data } = await axios(getAccessToken(appid, secret))
        if (!data.access_token) {
          throw new Error(data.errmsg)
        }
        accessToken = data.access_token
        expiresIn = data.expires_in * 1000
        createTime = Date.now()
        commit('UPDATE_ACCESSTOKEN', { appid, secret, accessToken, createTime, expiresIn })
      }
      return accessToken
    } catch (error) {
      throw error
    }
  }
}

export default {
  state,
  mutations,
  actions
}
