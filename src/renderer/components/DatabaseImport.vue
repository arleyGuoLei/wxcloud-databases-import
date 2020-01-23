<template>
  <div>hello</div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'database-import',
  components: {},
  data () {
    return {
    }
  },
  computed: {
  },
  mounted () {
    this.$electron.remote.getCurrentWindow().setTitle('数据库批量导入')
  },
  methods: {
    ...mapActions({
      login: 'login'
    })

  }
}
</script>

<style scoped>

</style>
