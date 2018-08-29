<template>
	<div class="">
		<div v-for="data in formdata" :key="data.id" class="mb-2">
			<input-field :type="type" :dataId="data.id" />
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
	data: function () {
		return {
			editing: false,
		};
	},
	props: {
		personId: {
			type: Number,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	computed: {
		...mapGetters([
			'personIncome',
		]),
		formdata: function () {
			// Switch here?
			console.log(this.$store.state)
			return this.personIncome(this.personId);
		},
	},
}
</script>