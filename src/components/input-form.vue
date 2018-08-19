<template>
	<div class="mb-4">
		<div v-for="data in formdata" :key="data.id" class="mb-2">
			<input-field :field="data" />
		</div>
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
		formdata: {
			type: Array,
			required: true,
		},
	},
}
</script>