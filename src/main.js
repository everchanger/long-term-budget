import Vue from 'vue'
import VueResource from 'vue-resource'
import root from './root.vue'
import router from './router'
import store from './store'

import './components'
import './assets/css/style.scss'


Vue.config.productionTip = false
Vue.use(VueResource)

// Disable for production
if (process.env.NODE_ENV === 'production') {
  Vue.http.options.root = '/api.php';
} else {
  Vue.http.options.root = 'http://localhost/api.php';
}

new Vue({
  router,
  store,
  render: h => h(root)
}).$mount('#app')
