<template>
	<div class="container mx-auto px-4 h-full mb-4">
		<navbar />
		<transition name="fade">
			<div v-if="alertMessage" id="alert-message" class="h-8 bg-red mb-3 flex justify-center items-center font-bold text-white">
				<p>{{ alertMessage }}</p>
			</div>
		</transition>
		<sidebar />
		<div class="h-full w-3/4 float-left px-2">
			<router-view />
		</div>
	</div>
</template>

<script>
import { mapActions } from 'vuex';
import { bus } from './event-bus.js';

export default {
	data: function () {
		return {
			alertMessage: null,
		};
	},
	methods: {
		...mapActions([
			'refreshUser',
		]),
		alert: function (message) {
			this.alertMessage = message;
			setTimeout(() => {
				this.alertMessage = null;
			}, 5000);
		},
	},
	mounted () {
		this.refreshUser();
		bus.$on('alert', this.alert);
	},
};
</script>
