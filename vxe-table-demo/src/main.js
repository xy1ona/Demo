// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'

import 'xe-utils'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

//import VXETablePluginVirtualTree from 'vxe-table-plugin-virtual-tree'
// import 'vxe-table-plugin-virtual-tree/dist/style.css'

Vue.config.productionTip = false

Vue.use(VXETable)
//VXETable.use(VXETablePluginVirtualTree)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
