<template>
	<div class="h-auto w-1/2 float-left">
		<div class=" border-2 border-black-light p-2 mb-2 rounded text-blue-light font-bold">
			Steg {{ step + 1 }} av {{ steps }}
		</div>
		<div class="w-full h-full border-2 border-black-light p-2 rounded">
			<input-form :formdata="forms[step]" />
			<div class="flex flex-row-reverse">
				<button class="btn btn-blue mr-0" @click="nextstep">Nästa</button>
				<button class="btn btn-blue-inverted mr-2"  @click="previousstep">Tillbaka</button>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	data: function () {
		return {
			step: 0,
			steps: 5,
			salery: null,
			forms: [
				{
					id: 0,
					header: 'Inkomster',
					entries: [
						{
							id: 0,
							label: 'Lön',
							value: null,
						},
						{
							id: 1,
							label: 'Annan inkomst',
							value: null,
						}
					],
				},
				{
					id: 1,
					header: 'Utgifter',
					entries: [
						{
							id: 0,
							label: 'Hyra',
							value: null,
						},
						{
							id: 1,
							label: 'Internet',
							value: null,
						}
					],
				}
			],
		}
	},
	methods: {
		nextstep () {
			this.step++;
			this.step = Math.min(this.step, this.steps - 1);
		},
		previousstep () {
			this.step--;
			this.step = Math.max(this.step, 0);
		}
	},
}
</script>