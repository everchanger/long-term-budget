<template>
	<div class="h-full">
		<h2 class="mb-2 text-grey-darker">Välkommen <span v-if="userAlias">{{ userAlias }}</span> till Budget!</h2>
		<budget-result />
	</div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
	computed: {
		...mapGetters([
			'userAlias',
		]),
	},
};

</script>
