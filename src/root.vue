<template>
	<div class="container mx-auto px-4 h-full mb-4">
		<navbar />
		<transition name="fade">
			<div v-if="alertMessage" class="h-8 bg-red mb-3 flex justify-center items-center font-bold text-white">
				<p>{{ alertMessage }}</p>
			</div>
		</transition>
		<sidebar />
		<div class="h-full w-3/4 float-left px-4">
			<router-view />
		</div>
	</div>
</template>

<script>
import { bus } from './event-bus.js';

export default {
	data: function () {
		return {
			alertMessage: null,
		}
	},
	methods: {
		alert: function (message) {
			this.alertMessage = message;
			setTimeout(() => {
				this.alertMessage = null;
			}, 5000);
		},
	},
	mounted() {
		bus.$on('alert', this.alert);
	}
}
</script>