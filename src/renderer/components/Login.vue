<template>
  <div id="wrapper">
    <header>
      <div id="top">
        <img src="~@/assets/close.png" alt="关闭" @click="close" draggable="false" />
      </div>
      <div id="logo">
        <img src="~@/assets/logo.png" alt="微信小程序云开发数据库批量导入" draggable="false" />
      </div>
    </header>
    <main id="main">
      <div class="row">
        <input v-model="appid" tabIndex="1" type="text" placeholder="请输入小程序appid" />
      </div>
      <div class="row">
        <input v-model="secret" tabIndex="2" id="password" type="password" placeholder="请输入Secret" />
        <img v-if="canLogin" tabIndex="-1" src="~@/assets/login-active.png" alt="登录" draggable="false" @click="enter"/>
        <img v-else src="~@/assets/login-disable.png" alt="请输入完整信息" draggable="false">
      </div>
    </main>
    <footer>
      <input type="checkbox" id="remember" v-model="remember" hidden />
      <label for="remember" id="remember-label">记住信息</label>
      <a tabIndex="-1" @click="openGithub" href="https://github.com/arleyGuoLei/wxcloud-databases-import" id="github">说明文档</a>
    </footer>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'login',
  components: {},
  data () {
    return {
      appid: localStorage.getItem('appid'),
      secret: localStorage.getItem('secret'),
      remember: true
    }
  },
  computed: {
    canLogin () {
      const { appid, secret } = this
      return appid && secret
    }
  },
  mounted () {
    this.$electron.remote.getCurrentWindow().setTitle('登录')
  },
  methods: {
    ...mapActions({
      login: 'login'
    }),
    openGithub (e) {
      this.$electron.shell.openExternal(e.target.href)
      e.preventDefault()
      return false
    },
    close () {
      this.$electron.remote.getCurrentWindow().close()
    },
    async enter (e) {
      const { appid, secret, remember } = this
      try {
        await this.login({appid, secret})
        if (remember) {
          localStorage.setItem('appid', appid)
          localStorage.setItem('secret', secret)
        } else {
          localStorage.removeItem('appid')
          localStorage.removeItem('secret')
        }
        this.$router.replace('/DatabaseImport')
      } catch (error) {
        this.$electron.remote.dialog.showMessageBox({
          type: 'info',
          title: '登录失败',
          message: error.message,
          buttons: ['确定'],
          icon: `${__static}/logo.png`
        })
      }
    }
  }
}
</script>

<style scoped>
#wrapper {
  width: 100%;
  height: 100%;
  background-color: #fff;
}

#top {
  height: 16px;
  margin-top: 10px;
}

#top > img {
  height: 16px;
  width: 16px;
  margin-left: 10px;
  -webkit-app-region: no-drag;
}

#logo {
  height: 75px;
  width: 100%;
  text-align: center;
  margin-top: 37px;
}

#logo > img {
  height: 75px;
  width: 75px;
}

#main {
  width: 180px;
  height: 80px;
  margin: 35px auto 0 auto;
}
.row > input {
  height: 25px;
  width: 100%;
  outline: none;
  border: 0;
  font-size: 16px;
  margin-top: 8px;
  padding: 0;
}
.row {
  position: relative;
  height: 40px;
  overflow: hidden;
}
.row::after {
  display: block;
  content: " ";
  height: 1px;
  width: 100%;
  background-color: #dadcde;
  position: absolute;
  bottom: 0;
}
.row img {
  width: 18px;
  height: 18px;
  display: inline-block;
  position: absolute;
  top: 13px;
  right: 4px;
}
img:focus, a {
  border: 0;
  outline: none;
}
#password::-webkit-input-placeholder {
  font-size: 16px !important;
  transform: translate(0, -6px);
}
#password {
  width: 154px;
  display: inline-block;
  font-size: 40px;
  font-family: Arial;
  height: 25px;
  line-height: 25px;
}
footer {
  height: 35px;
  margin-top: 18px;
  text-align: center;
}
#remember-label {
  font-size: 14px;
  color: #888;
  height: 20px;
  line-height: 20px;
  display: inline-block;
  background-image: url("~@/assets/no-choise.png");
  background-repeat: no-repeat;
  background-size: 20px;
  vertical-align: middle;
  padding-left: 24px;
  margin-top: 10px;
}
#remember:checked + #remember-label {
  background-image: url("~@/assets/choise.png");
}
#github {
  text-decoration: none;
  color: #888;
  font-size: 14px;
  height: 20px;
  line-height: 20px;
  display: inline-block;
  background-image: url("~@/assets/github.png");
  background-repeat: no-repeat;
  background-size: 20px;
  vertical-align: middle;
  padding-left: 24px;
  margin-top: 10px;
  margin-left: 14px;
}
</style>
