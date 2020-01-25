<template>
  <div id="wrapper">
    <section id="left">
      <h1>微信小程序云开发 - 数据库批量导入</h1>
      <main id="form">
        <div class="line">
          <p>环境ID</p>
          <input v-model="envId" class="line-input" type="text" placeholder="请输入环境ID" />
        </div>
        <div class="line">
          <p>集合名</p>
          <input v-model="collectionName" class="line-input" type="text" placeholder="请输入数据库集合名" />
        </div>
        <div class="line">
          <p>导入类型</p>
          <select
            class="line-input"
            v-model="type"
            :disabled="fileList.length!==0"
            title="请选择数据导入类型"
          >
            <option>JSON</option>
            <option>CSV</option>
          </select>
        </div>
        <div class="line">
          <p>冲突处理</p>
          <select class="line-input" v-model="mode" title="请选择冲突处理方式">
            <option>INSERT</option>
            <option>UPSERT</option>
          </select>
        </div>
        <div class="line">
          <p>上传文件(夹)</p>
          <button @click="addFile" class="line-input line-button">增加文件/目录</button>
        </div>
        <div class="line">
          <div class="checkbox">
            <input type="checkbox" id="errorStop" v-model="errorStop" hidden />
            <label for="errorStop">遇到错误时停止</label>
          </div>
          <div class="checkbox">
            <input type="checkbox" id="overDelete" v-model="overDelete" hidden />
            <label for="overDelete">导入完成删除上传</label>
          </div>
        </div>
        <div class="line">
          <button class="form-btn" @click="quit">取消</button>
          <button
            class="form-btn"
            @click="startImport"
            :disabled="isStart"
          >{{isStart ? '导入中' : '开始'}}</button>
        </div>
      </main>
      <div class="loading" v-show="isStart">
        <div class="loader"></div>
      </div>
    </section>
    <section id="right">
      <div class="log-item" v-for="(file, index) in fileList" :key="file.path">
        <div class="log-item__header">
          <p>导入“{{getFileName(file.path)}}”</p>
          <p>{{file.progress}}%</p>
        </div>
        <div class="log-item__body">
          <progress max="100" :value="file.progress"></progress>
          <img src="~@/assets/delete.png" v-show="file.progress<90" @click="deleteFile(index)" alt="删除文件" />
        </div>
        <div class="log-item__log">{{file.log}}</div>
      </div>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { getAllFiles } from '@/utils/tool.js'
import { getUploadFileInfo, uploadFile, databaseMigrateImport, databaseMigrateQueryInfo, batchDeleteFile, databaseCollectionAdd } from '@/utils/api.js'
const HEIGHT = 375
const WIDTH = 400
const LOG_WIDTH = 750

export default {
  name: 'database-import',
  components: {},
  data () {
    return {
      envId: '',
      collectionName: '',
      type: 'JSON',
      mode: 'INSERT',
      errorStop: true,
      overDelete: true,
      fileList: [],
      pathDuplicateRemoval: {}, // 路径去重
      isStart: false,
      overLen: 0
    }
  },
  computed: {
    ...mapState({
      appid: state => (state.Auth.appid),
      secret: state => (state.Auth.secret)
    })
  },
  mounted () {
    this.$electron.remote.getCurrentWindow().setTitle('数据库批量导入')
    this.$electron.remote.getCurrentWindow().setSize(WIDTH, HEIGHT)
    this.$electron.remote.getCurrentWindow().center()
  },
  watch: {
    overLen () {
      const { length } = this.fileList
      if (this.overLen === length && length !== 0) {
        this.isStart = false
        this.overLen = 0
        this.fileList = []
        this.pathDuplicateRemoval = {}
        this.$electron.remote.dialog.showMessageBox({
          type: 'info',
          title: '提示',
          message: '已完成所有数据库导入',
          buttons: ['确定'],
          icon: `${__static}/logo.png`
        })
      }
    },
    fileList () {
      const [, width] = this.$electron.remote.getCurrentWindow().getSize()
      if (this.fileList.length !== 0) {
        if (width !== LOG_WIDTH) {
          this.$electron.remote.getCurrentWindow().setSize(LOG_WIDTH, HEIGHT)
        }
      } else {
        this.isStart = false
        if (width !== WIDTH) {
          this.$electron.remote.getCurrentWindow().setSize(WIDTH, HEIGHT)
        }
      }
    }
  },
  methods: {
    ...mapActions({
      login: 'login'
    }),
    quit () {
      this.$router.replace('/')
    },
    deleteFile (id) {
      this.fileList[id].cancel()
      const path = this.fileList[id].path
      this.pathDuplicateRemoval[path] = false
      this.fileList.splice(id, 1)
    },
    async addFile () {
      const paths = this.$electron.remote.dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory', 'multiSelections'],
        filters: [{ name: '数据库', extensions: ['json', 'csv'] }]
      })
      if (paths) {
        const files = getAllFiles(paths, this.type)
        files.forEach(file => {
          if (!this.pathDuplicateRemoval[file]) {
            this.fileList.push({
              path: file,
              progress: 0,
              log: '已选择文件, 等待上传导入...',
              fileId: '',
              cancel: () => {}
            })
            this.pathDuplicateRemoval[file] = true
          }
        })
      }
    },
    getFileName (file) {
      return file.match(/.+\/(.+)$/)[1]
    },
    async queryInfo (index, jobId) {
      const { appid, secret, envId, overDelete } = this
      const config = databaseMigrateQueryInfo(await this.login({appid, secret}), envId, jobId)
      const { data } = await this.$http(config)
      if (data.errcode !== 0) {
        this.fileList[index].log = '任务失败: ' + data.errmsg
      }
      if (data.status !== 'success') {
        setTimeout(() => {
          this.fileList[index].log = `(导入中) 任务${jobId}: ${data.status} ...`
          return this.queryInfo(index, jobId)
        }, 1000)
      } else {
        this.fileList[index].log = `成功导入: ${data.record_success}条数据`
        if (overDelete) {
          this.fileList[index].progress = 99
          await this.deleteCloudFile(this.fileList[index].fileId)
          this.fileList[index].progress = 100
          this.fileList[index].log = `成功导入: ${data.record_success}条数据 (已删除存储)`
          this.overLen++
        } else {
          this.fileList[index].progress = 100
          this.overLen++
        }
      }
    },
    async deleteCloudFile (fileId) {
      const { appid, secret, envId } = this
      const config = batchDeleteFile(await this.login({ appid, secret }), envId, fileId)
      const { data } = await this.$http(config)
      return data
    },
    async startImport () {
      const { envId, collectionName, fileList, appid, secret } = this
      if (
        envId.length === 0 ||
        collectionName.length === 0 ||
        fileList.length === 0
      ) {
        this.$electron.remote.dialog.showMessageBox({
          type: 'info',
          title: '提示',
          message: '请填写完整表单信息',
          buttons: ['确定'],
          icon: `${__static}/logo.png`
        })
        return ''
      }
      this.isStart = true
      await this.$http(databaseCollectionAdd(await this.login({appid, secret}), envId, collectionName))
      this.forImport()
    },
    async forImport () {
      const { fileList, envId, type, appid, secret, collectionName, errorStop, mode } = this
      for (const [index, file] of Object.entries(fileList)) {
        try {
          // 1. 获取上传参数和url
          const re = new RegExp(`.+/(.+)(.${type})$`, 'i')
          const files = file.path.match(re)
          const path = `${files[1]}_${Date.now()}${files[2]}`
          const uploadInfo = await getUploadFileInfo(await this.login({appid, secret}), envId, path)
          const { data } = await this.$http(uploadInfo)
          if (data.errcode !== 0) {
            throw new Error(data.errmsg)
          }

          this.fileList[index].log = '获取上传链接成功, 准备上传...'
          this.fileList[index].fileId = data.file_id
          console.log('log => : forImport -> data', data)

          // 2. 开始上传文件
          const baseConfig = uploadFile(data.url, path, data.authorization, data.token, data.cos_file_id, this.fileList[index].path)
          baseConfig.cancelToken = new this.$http.CancelToken((c) => {
            this.fileList[index].cancel = c
          })
          baseConfig.onUploadProgress = progressEvent => {
            const complete = (progressEvent.loaded / progressEvent.total * 100 | 0) - 10
            this.fileList[index].progress = complete >= 0 ? complete : 0
          }
          await this.$http(baseConfig)

          this.fileList[index].log = '文件上传成功, 正在导入...'

          //  3. 导入
          const importConfig = databaseMigrateImport(await this.login({appid, secret}), envId, collectionName, path, type, errorStop, mode)
          const result = await this.$http(importConfig)
          if (result.data.errcode !== 0) {
            throw new Error(result.data.errmsg)
          }
          const jobId = result.data.job_id
          this.fileList[index].log = `已经申请导入, 任务ID: ${jobId}`
          this.fileList[index].progress = 95

          this.queryInfo(index, jobId)
        } catch (error) {
          this.overLen++
          if (typeof (this.fileList[index].log) !== 'undefined') {
            this.fileList[index].log = error.message
          }
        }
      }
    }
  }
}
</script>

<style scoped>
#wrapper {
  height: 375px;
  display: flex;
  overflow: scroll;
}
#left {
  width: 400px;
  height: 100%;
  background-color: #fcfcfc;
  position: relative;
  z-index: 0;
}
#left > h1 {
  height: 22px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 1);
  line-height: 22px;
  margin: 13px 0 0 13px;
  padding: 0;
}
#form {
  width: 100%;
  margin-top: 33px;
}
.line {
  width: 342px;
  display: flex;
  margin: 16px auto 0 auto;
  justify-content: space-between;
  align-items: center;
  height: 24px;
}
.line > p {
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.7);
  line-height: 22px;
  height: 22px;
  display: inline-block;
}
.line-input {
  width: 238px;
  height: 24px;
  outline: none;
  border: 1px solid rgba(151, 151, 151, 0.5);
  font-size: 14px;
  padding-left: 5px;
  box-sizing: border-box;
}
.line-input:focus {
  border-color: #51b273;
  outline: 0;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075),
    0 0 8px rgba(81, 178, 115, 0.6);
}
.line-button {
  background-color: rgb(248, 248, 248);
}
.checkbox {
  padding: 0 20px;
}
.checkbox > label {
  font-size: 14px;
  color: #888;
  height: 20px;
  line-height: 20px;
  display: inline-block;
  background-image: url("~@/assets/no-choise2.png");
  background-repeat: no-repeat;
  background-size: 20px;
  vertical-align: middle;
  padding-left: 24px;
  margin-top: 10px;
}
.checkbox > input:checked + label {
  background-image: url("~@/assets/choise2.png");
}
#form .line:last-child {
  margin-top: 30px;
  padding: 0 70px;
  box-sizing: border-box;
}
.form-btn {
  width: 80px;
  height: 24px;
  border-radius: 4px;
  outline: none;
  font-size: 14px;
}
.form-btn:first-child {
  background-color: #fafafa;
  border: 1px solid #979797;
}
.form-btn:hover {
  border-color: #51b273;
  outline: 0;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075),
    0 0 8px rgba(81, 178, 115, 0.6);
}
.form-btn:last-child {
  background-color: #51b273;
  border: 0;
  color: #ffffff;
}

/* right */
#right {
  flex: 1;
  overflow-y: scroll;
}
.log-item {
  height: 90px;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0 8px;
}
.log-item:nth-child(even) {
  background-color: #f7f7f6;
}
.log-item:nth-child(odd) {
  background-color: #ffffff;
}
.log-item__header {
  height: 20px;
  width: 100%;
  display: flex;
  margin-top: 8px;
}
.log-item__header > p:first-child {
  height: 20px;
  line-height: 20px;
  display: inline-block;
  margin: 0;
  width: 290px;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.log-item__header > p:last-child {
  height: 20px;
  line-height: 20px;
  display: inline-block;
  margin: 0;
  flex: 1;
  font-size: 14px;
  text-align: center;
  color: #888888;
}
.log-item__body {
  height: 24px;
  width: 100%;
  display: flex;
  margin-top: 8px;
  align-items: center;
  overflow: hidden;
}
.log-item__body > progress {
  height: 8px;
  width: 290px;
  background-color: #51b273;
  border-radius: 4px;
}
.log-item__body > progress::-webkit-progress-bar {
  background-color: #d7d7d7;
  border-radius: 4px;
}

.log-item__body > progress::-webkit-progress-value {
  background-color: #51b273;
  border-radius: 4px;
}
.log-item__body > img {
  height: 20px;
  width: 20px;
  margin: 0 auto;
}
.log-item__body > img:hover {
  border-color: #51b273;
  outline: 0;
  border-radius: 50%;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075),
    0 0 8px rgba(81, 178, 115, 0.6);
}
.log-item__log {
  font-size: 14px;
  height: 18px;
  line-height: 18px;
  margin-top: 4px;
  color: #888888;
}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 400px;
  height: 375px;
  font-size: 36px;
  color: #51b273;
  vertical-align: top;
  transition: 0.3s color, 0.3s border;
  text-align: center;
  padding-top: 150px;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 999;
  box-sizing: border-box;
}
.loader {
  -webkit-transform: rotateZ(45deg);
  transform: rotateZ(45deg);
  -webkit-perspective: 1000px;
  perspective: 1000px;
  border-radius: 50%;
  display: inline-block;
  width: 1em;
  height: 1em;
  color: inherit;
  vertical-align: middle;
  pointer-events: none;
}
.loader:before,
.loader:after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: inherit;
  height: inherit;
  border-radius: 50%;
  -webkit-animation: 1s spin linear infinite;
  animation: 1s spin linear infinite;
}
.loader:before {
  -webkit-transform: rotateX(70deg);
  transform: rotateX(70deg);
}
.loader:after {
  -webkit-transform: rotateY(70deg);
  transform: rotateY(70deg);
  -webkit-animation-delay: 0.4s;
  animation-delay: 0.4s;
}

@keyframes spin {
  0%,
  100% {
    box-shadow: 0.2em 0px 0 0px currentcolor;
  }
  12% {
    box-shadow: 0.2em 0.2em 0 0 currentcolor;
  }
  25% {
    box-shadow: 0 0.2em 0 0px currentcolor;
  }
  37% {
    box-shadow: -0.2em 0.2em 0 0 currentcolor;
  }
  50% {
    box-shadow: -0.2em 0 0 0 currentcolor;
  }
  62% {
    box-shadow: -0.2em -0.2em 0 0 currentcolor;
  }
  75% {
    box-shadow: 0px -0.2em 0 0 currentcolor;
  }
  87% {
    box-shadow: 0.2em -0.2em 0 0 currentcolor;
  }
}
</style>
