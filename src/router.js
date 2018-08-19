import Vue from 'vue'
import Router from 'vue-router'
import home from './views/home.vue'
import collector from './views/collector.vue'

Vue.use(Router)

export default new Router({
	mode: 'history',
	base: process.env.BASE_URL,
	routes: [
		{
			path: '/',
			name: 'home',
			component: home,
		},
		{
			path: '/collector/:id',
			name: 'collector',
			component: collector,
		},
	]
})
