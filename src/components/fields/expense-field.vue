<template>
	<div>
		<transition name="fade-fast" mode="out-in">
			<button v-if="! editing" class="btn btn-blue" @click="editing = true;">{{ buttonLabel }}</button>
			<div v-else class="bg-blue text-white p-2 rounded">
				<label class="block text-sm font-bold mb-2">{{ fieldTitle }}</label>
				<div>
					<input class="m-aut input-text w-3/4" type="text" v-model="fieldValue" placeholder="SEK"/>
					<button class="btn btn-blue border-white border-2 ml-2" @click="editing = false">OK</button>
				</div>
			</div>
		</transition>
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
		incomeId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		...mapGetters([
			'income',
		]),
		buttonLabel () {
			if (! this.fieldValue) {
				return this.fieldTitle;
			}
			return this.fieldTitle + ' - ' + this.fieldValue + ' kr';
		},
		field: function () {
			return this.$store.state.income[this.incomeId];
		},
		fieldTitle: function () {
			return this.field.title;
		},
		fieldValue: {
			get: function () {
				return this.field.income;
			},
			set: function (value) {
				// Do an vuex action to set the right data!
				console.log(value);
			},
		}
	}
}
</script>
