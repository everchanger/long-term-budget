import Vue from 'vue'

// Components
import navbar from './views/navbar.vue'
import sidebar from './views/sidebar.vue'
import wizard from './components/wizard.vue'
import inputform from './components/input-form.vue'
import inputfield from './components/input-field.vue'
import budgetresult from './components/budget-result.vue'

Vue.component('navbar', navbar)
Vue.component('sidebar', sidebar)
Vue.component('wizard', wizard)
Vue.component('input-form', inputform)
Vue.component('input-field', inputfield)
Vue.component('budget-result', budgetresult)
