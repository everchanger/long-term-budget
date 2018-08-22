<template>
	<div class="h-full">
		<h2 class="mb-2 p-2 text-grey-darker">INKOMSTER/UTGIFTER/LÅN {{ $route.params.id }}</h2>
		<div class="w-1/2 float-left p-2">
			<div class="border-2 border-grey-dark p-2 mb-4 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Inkomster</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(budgetData.income) }} kr/månad</h3>
				</div>
				<input-form :formdata="budgetData.income" />
			</div>
			<div class="border-2 border-grey-dark p-2 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Lån</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(budgetData.loans) }}</h3>
				</div>
				<input-form :formdata="budgetData.loans" />
			</div>
		</div>
		<div class="w-1/2 float-left p-2">
			<div class="border-2 border-grey-dark mb-4 p-2 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Utgifter</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(budgetData.expenses) }} kr/månad</h3>
				</div>
				<input-form :formdata="budgetData.expenses" />
			</div>
			<div class="border-2 border-grey-dark p-2 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Sparande</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(budgetData.savings) }}</h3>
				</div>
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
					return person.data;
				}
			}
			return null;
		},
	},
	methods: {
		monthlySum (values) {
			const array1 = [1, 2, 3, 4];
			const sum = (acc, current) => Number(acc) + Number(current.value);
			return values.reduce(sum, 0);
		}
	},
}
</script>
