<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'wxcloud-databases-import'
  }
</script>

<style>
  body,
  html {
    padding: 0;
    margin: 0;
    height: 100%;
    font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
    -webkit-app-region: drag;
  }
  #app {
    user-select: none;
    overflow: hidden;
  }
</style>
