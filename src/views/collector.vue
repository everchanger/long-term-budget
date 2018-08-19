<template>
	<div class="h-full">
		<h2 class="mb-2 p-2 text-grey-darker">INKOMSTER/UTGIFTER/LÅN {{ $route.params.id }}</h2>
		<div class="w-1/2 float-left p-2">
			<div class="border-2 border-grey-dark p-2 mb-4 w-full rounded shadow-md">
				<h3 class="text-grey-darker mb-2">Inkomster</h3>
				<input-form :formdata="budgetData.income" />
			</div>
			<div class="border-2 border-grey-dark p-2 w-full rounded shadow-md">
				<h3 class="text-grey-darker mb-2">Lån</h3>
				<input-form :formdata="budgetData.loans" />
			</div>
		</div>
		<div class="w-1/2 float-left p-2">
			<div class="border-2 border-grey-dark mb-4 p-2 w-full rounded shadow-md">
				<h3 class="text-grey-darker mb-2">Utgifter</h3>
				<input-form :formdata="budgetData.expenses" />
			</div>
			<div class="border-2 border-grey-dark p-2 w-full rounded shadow-md">
				<h3 class="text-grey-darker mb-2">Sparande</h3>
				<input-form :formdata="budgetData.savings" />
			</div>
		</div>
	</div>
</template>

<script>
export default {
	computed: {
		budgetData () {
			for (const person of this.$store.state.persons) {
				if (person.id === Number(this.$route.params.id)) {
					console.log('found')
					return person.data;
				}
			}
			return null;
		},
	},
	methods: {
	},
}
</script>
