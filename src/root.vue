<template>
	<div class="container mx-auto px-4 h-full mb-4">
		<navbar />
		<div class="fixed pin-b pin-r mb-8 mr-8 w-1/4">
			<transition-group name="fade">
				<toast v-for="(toast, index) in toasts" :key="index" :message="toast.message" :type="toast.type" />
			</transition-group>
		</div>
		<sidebar />
		<div class="h-full w-3/4 float-left px-2">
			<router-view />
		</div>
	</div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
    computed: {
        ...mapGetters([
            'toasts',
        ]),
    },
    methods: {
        ...mapActions([
            'refreshUser',
        ]),
    },
    mounted () {
        this.refreshUser();
    },
};
</script>
