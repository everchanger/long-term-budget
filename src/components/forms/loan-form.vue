<template>
	<div class="">
		<div v-for="data in formdata" :key="data.id" class="mb-2">
			<loan-field :loanId="data.id" />
		</div>
		<button class="btn btn-blue">+</button>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';

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
	},
	computed: {
		...mapGetters([
			'personLoans',
		]),
		formdata: function () {
			return this.personLoans(this.personId);
		},
	},
};
</script>
