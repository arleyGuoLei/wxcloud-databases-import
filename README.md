# 微信小程序云开发数据库批量导入

> 基于electron-vue实现的微信小程序云开发数据库文件批量导入。

为实现"微信小程序云开发"数据库文件批量导入(官方工具仅支持单文件导入)，学习electron，过年趁机开心一波，使用electron-vue实现微信小程序云开发数据库文件(夹)批量导入工具。

## 项目展示

### 需求分析

为了毕设项目，通过`python`爬下了n多的单词JSON数据(预计: 16w词源，分布于约81个文件内)，但是需要导入到微信小程序云开发的类`MongoDB`数据库。官方开发工具仅支持单文件上传导入，一个文件一个文件的导入，那岂不“DIE”。

需导入的文件目录如下：

![待导入数据.png](https://i.loli.net/2020/01/25/b7jfiM5Hoc8h1Xz.png)

### 项目截图

先使用sketch大概画了一下设计图，[设计图源文件](https://github.com/arleyGuoLei/wxcloud-databases-import/blob/master/wxcloud-pi.sketch)

- 登录页面

![login.png](https://i.loli.net/2020/01/25/gpwEUJBnYTcdF2v.png)

![login-存在输入.png](https://i.loli.net/2020/01/25/15hkiZyGp4q7eKN.png)

- 导入页面

![导入窗口.png](https://i.loli.net/2020/01/25/Ec2KBnh58VtY3W1.png)

![选择文件后准备导入.png](https://i.loli.net/2020/01/25/8VIhxkNBGdLXi7E.png)

![部分导入完成.png](https://i.loli.net/2020/01/25/NVGD7LYdw4TkO39.png)

![完成导入.png](https://i.loli.net/2020/01/25/mqbNIuMGlA9oODy.png)

- 最终导入结果

![导入结果.png](https://i.loli.net/2020/01/25/5lJem3TiFbPDKHg.png)

### 项目开源

项目主要依赖于微信小程序云开发http接口，[微信文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/database/databaseMigrateImport.html)

[☁ 基于electron-vue实现的微信小程序云开发数据库文件批量导入。](https://github.com/arleyGuoLei/wxcloud-databases-import/) ✨✨✨✨

## 一起撸

### 项目初始化/运行

初始化过程就是一路选择，然后`install`就可以，推荐先食用[electron-vue文档](https://simulatedgreg.gitbooks.io/electron-vue/content/cn/)。

1. 项目使用`electron-vue`开发，官方初始化方案如下(会遇到问题, 看下解析):

```bash
# Install vue-cli and scaffold boilerplate
npm install -g vue-cli
vue init simulatedgreg/electron-vue my-project

# Install dependencies and run your app
cd my-project
yarn # or npm install
yarn run dev # or npm run dev
```

- 问题一: `vue init simulatedgreg/electron-vue my-project`卡在模板下载的解决方案

由于官方模板使用`github`源作为模板，导致初始化very的慢，所以先使用国内源克隆，然后通过本地目录执行`vue init`

```bash
cd ~/Code
git clone https://gitee.com/mirrors/electron-vue.git #国内镜像
vue init ~/Code/electron-vue project-name
```

- 问题二: 项目初始化完成后，`npm install`安装依赖过程中`electron`下载失败

使用官方的electron源下载安装会一直失败，梯zi之后也不行。所以还是通过国内源来下载，分electron7以上版本和以下版本的方案，设置好源之后再次`install`即可。

```bash
# 1. v7以上
npm config set ELECTRON_MIRROR=https://cdn.npm.taobao.org/dist/electron/

npm config set electron_custom_dir=7.1.9 # 修改为需要安装的版本

# 2. v7以下
npm config set ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/
```

- 问题三: `npm run dev`之后报错[error: Webpack ReferenceError: process is not defined](https://github.com/SimulatedGREG/electron-vue/issues/871)

```js
// 修改下方两个webpack配置文件中的HtmlWebpackPlugin配置

// .electron-vue/webpack.web.config.js
// .electron-vue/webpack.renderer.config.js
new HtmlWebpackPlugin({
  filename: 'index.html',
  template: path.resolve(__dirname, '../src/index.ejs'),
  templateParameters(compilation, assets, options) {
    return {
      compilation: compilation,
      webpack: compilation.getStats().toJson(),
      webpackConfig: compilation.options,
      htmlWebpackPlugin: {
        files: assets,
        options: options
      },
      process,
    };
  },
  minify: {
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true
  },
  nodeModules: process.env.NODE_ENV !== 'production' ? path.resolve(__dirname, '../node_modules') : false
}),
```

### 开发阶段

1. 通过"千心和万苦"项目终于跑起来了。先简述一下这个项目之后对`electron`的理解：

- electron = 主进程(浏览器容器) + 渲染进程("普通"前端开发)
- 可通过api自定义的浏览器，不仅限于样式/规则/菜单等
- 可以调用nodejs或更多api的浏览器，渲染进程中也可以调用nodejs函数

把自己的心态调整为：正在开发浏览器端应用，只是这个浏览器容器“变小了”了，没有标签栏了。

2. 浏览器证明：跨域

electron应用也存在跨域问题，通常前端中可以找服务端通过`cors`解决。但跨域问题本质是浏览器对不同源请求的一些限制。所以electron中最方便的方案，则是关闭浏览器的这一种限制。

```js
// 主进程中，实例化窗口时设置BrowserWindow如下，就可以关闭限制
  mainWindow = new BrowserWindow({
    // ...
    webPreferences: {
      webSecurity: false
    }
  })
```

3. renderer中渲染进程的ui开发

这一个只要大家心态对了，那就是浏览器应用开发，前端部分不深入讨论。

```md
├── App.vue
├── assets
|  ├── Github.png
|  ├── choise.png
|  ├── choise2.png
|  ├── close.png
|  ├── delete.png
|  ├── login-active.png
|  ├── login-disable.png
|  ├── logo.png
|  ├── no-choise.png
|  └── no-choise2.png
├── components
|  ├── DatabaseImport.vue
|  └── Login.vue
├── main.js
├── router
|  └── index.js
├── store
|  ├── index.js
|  └── modules
└── utils
   ├── api.js
   ├── disableDrag.js
   └── tool.js
```

4. 隐藏默认窗口后，窗口如何拖动

在主进程中设置BrowserWindow为`frame`, 隐藏默认窗口。

```js
mainWindow = new BrowserWindow({
    height: 316,
    useContentSize: true,
    width: 248,
    maximizable: false,
    resizable: false,
    webPreferences: {
      webSecurity: false
    },
    frame: false, // 设置此属性为false
    icon: `${__static}/logo.png`,
    center: true
  })
```

如此一下，窗口就不能拖动了。解决方案为在渲染进程，全局app设置css属性

```css
/* app.vue style */
  body,
  html {
    -webkit-app-region: drag;
  }
```

5. 窗口“复制剪切粘贴全选”等快捷键失效

在开发环境不会禁用默认菜单，所以快捷键不会失效，但是打包为production之后，打开的窗口就出现了问题，解决方案如下

```js
import { globalShortcut } from 'electron'

app.on('browser-window-focus', () => {
  if (!mainWindow) return

  if (process.platform === 'darwin') {
    let contents = mainWindow.webContents

    globalShortcut.register('CommandOrControl+C', () => {
      contents.copy()
    })

    globalShortcut.register('CommandOrControl+V', () => {
      contents.paste()
    })

    globalShortcut.register('CommandOrControl+X', () => {
      contents.cut()
    })

    globalShortcut.register('CommandOrControl+A', () => {
      contents.selectAll()
    })
  }
})
// 注意globalShortcut注册之后会覆盖其他的快捷键，所以blur的时候取消快捷键
app.on('browser-window-blur', () => {
  globalShortcut.unregisterAll()
})

```

### 打包阶段

1. 个人觉得`electron`应用的优缺点

优点

- 开发简单(任何前端攻城狮不看官方文档都可以简单上手)
- 跨平台 [哈哈哈，如果`易语言`可以这么🐂🍺的跨平台，那我一样的"小学生"就无敌了 ]
- 社区活跃，坑比较好跳

缺点

- 文件大
- 文件大
- 文件大
- ...

2. `electron-packager` 和 `electron-builder`

姑且理解为`electron-packager`打包的的可执行文件(打开即用， 文件大), `electron-builder`打包为安装包(压缩包， 文件小)

3. electron-vue通过`electron-builder`打包报错(忘记错误了...)

升级`electron-builder`为最新版本即可。
