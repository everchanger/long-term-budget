<template>
	<div class="h-full">
		<h2 class="mb-2 p-2 text-grey-darker">INKOMSTER/UTGIFTER/LÅN {{ $route.params.id }}</h2>
		<div class="w-1/2 float-left p-2">
			<div class="border-2 border-grey-dark p-2 mb-4 w-full rounded shadow-md">
				<income-form :personId="personId" />
			</div>
			<div class="border-2 border-grey-dark p-2 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Lån</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(0) }}</h3>
				</div>
				<loan-form :personId="personId" />
			</div>
		</div>
		<div class="w-1/2 float-left p-2">
			<div class="border-2 border-grey-dark mb-4 p-2 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Utgifter</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(0) }} kr/månad</h3>
				</div>
				<expense-form :personId="personId" />
			</div>
			<div class="border-2 border-grey-dark p-2 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Sparande</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(0) }}</h3>
				</div>
				<savings-form :personId="personId" />
			</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
	computed: {
		...mapGetters([
			'personIncome',
		]),
		personId () {
			return Number(this.$route.params.id);
		},
	},
	methods: {
		monthlySum (values) {
			return values;
			const array1 = [1, 2, 3, 4];
			const sum = (acc, current) => Number(acc) + Number(current.value);
			return values.reduce(sum, 0);
		}
	},
}
</script>
