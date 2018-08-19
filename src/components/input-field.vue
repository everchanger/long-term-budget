<template>
	<div>
		<transition name="fade-fast" mode="out-in">
			<button v-if="! editing" class="btn btn-blue" @click="editing = true;">{{ buttonLabel }}</button>
			<div v-else>
				<label class="block text-grey-darker text-sm font-bold mb-2">{{ field.label }}</label>
				<div>
				<input class="m-aut input-text w-3/4" type="text" v-model="field.value" placeholder="SEK"/>
				<button class="btn btn-blue ml-2" @click="editing = false">OK</button>
				</div>
			</div>
		</transition>
	</div>
</template>

<script>
export default {
	data: function () {
		return {
			editing: false,
		};
	},
	props: {
		field: {
			type: Object,
			required: true,
		},
	},
	computed: {
		buttonLabel () {
			if (! this.field.value) {
				return this.field.label;
			}
			return this.field.label + ' - ' + this.field.value + ' kr';
		},
	}
}
</script>