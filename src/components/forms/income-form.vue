<template>
	<div class="">
		<div class="h-8">
			<h3 class="text-grey-darker mb-2 float-left">Inkomster</h3>
			<h3 class="text-grey-darker mb-2 float-right">{{ sum }}/månad</h3>
		</div>
		<div v-for="data in formdata" :key="data.id" class="mb-2">
			<income-field :incomeId="data.id" />
		</div>
		<transition name="fade-fast" mode="out-in">
			<button v-if="adding === false" class="btn btn-blue" @click="adding = true">+</button>
			<div v-else class="bg-blue text-white p-2 rounded">
				<label class="block text-sm font-bold mb-2">Typ av inkomst</label>
				<div class="mb-2">
					<select v-model="newIncomeTitle">
						<option v-for="(incomeType, k, index) in incomeTypes" :key="index" :value="incomeType">{{ incomeType }}</option>
					</select>
				</div>
				<label class="block text-sm font-bold mb-2">Antal kronor/månad</label>
				<div  class="mb-4">
					<input class="m-aut input-text w-3/5" type="text" v-model="newIncomeValue" placeholder="SEK"/>
				</div>
				<button class="btn btn-blue border-white border-2" @click="addIncome">Lägg till</button>
			</div>
		</transition>
	</div>
</template>

<script>
import { mapGetters } from 'vuex'

const incomeTypes = [
	'Lön',
	'Pension',
	'Övrig inkomst',
]

export default {
	data: function () {
		return {
			adding: false,
			newIncomeTitle: null,
			newIncomeValue: null,
			incomeTypes: incomeTypes,
		};
	},
	props: {
		personId: {
			type: Number,
			required: true,
		},
	},
	methods: {
		addIncome: function () {
			const vm = this;
			this.$store.dispatch('addIncome', { personId: this.personId, title: this.newIncomeTitle, income: this.newIncomeValue }).then(function () {
				vm.newIncomeTitle = null;
				vm.newIncomeValue = null;
				vm.adding = false;
				console.log('done!');
			});
		},
		numberWithSpaces (x) {
			const numberFormatter = new Intl.NumberFormat('sv-SE', {style: 'currency', currency: 'SEK', minimumFractionDigits: 0});

			return numberFormatter.format(x);
		}
	},
	computed: {
		...mapGetters([
			'personIncome',
		]),
		formdata: function () {
			return this.personIncome(this.personId);
		},
		sum: function () {
			const income = this.personIncome(this.personId).map(inc => inc.income);
			const sum = (acc, current) => Number(acc) + Number(current);
			const result = this.numberWithSpaces(income.reduce(sum, 0));
			return result;
		},
	},
	mounted () {
		console.log(this.adding)
	},
}
</script>
