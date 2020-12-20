// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'

import 'xe-utils'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

import 'umy-ui/lib/theme-chalk/index.css'// 引入样式

import { UTable, UTableColumn } from 'umy-ui'

Vue.config.productionTip = false

Vue.use(VXETable)

Vue.use(UTable)
Vue.use(UTableColumn)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
