<template>
	<div class="mb-4">
		<h3 class="text-grey-darker mb-3">{{ formdata.header }}</h3>
		<div v-for="data in formdata.entries" :key="data.id" class="mb-2">
			<label class="block text-grey-darker text-sm font-bold mb-2">{{ data.label }}</label>
			<input class="m-aut input-text w-1/4" type="text" v-model="data.value" placeholder="SEK"/>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		formdata: {
			type: Object,
			required: true,
		},
	},
	mounted () {
		console.log(this.formdata);
	}
}
</script>