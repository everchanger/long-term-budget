import Vue from 'vue'
import root from './root.vue'
import router from './router'
import store from './store'

import './components'
import './assets/css/style.scss'


Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(root)
}).$mount('#app')
