<template>
    <div class="bg-indigo-dark text-white">
        <div class="h-8 bg-indigo flex justify-between">
            <h3 class="p-2 mb-1">Inkomster</h3>
            <h3 class="p-2 mb-1">{{ sum }}/månad</h3>
        </div>
        <div class="p-2" ref="main">
            <div v-for="data in formdata" :key="data.id" class="mb-2">
                <income-field :incomeId="data.id" />
            </div>
            <transition name="fade-fast" mode="out-in">
                <button v-if="adding === false" class="btn btn-indigo" @click="adding = true">+</button>
                <div v-else class="bg-indigo text-white p-2 rounded">
                    <label class="block text-sm font-bold mb-2">Typ av inkomst</label>
                    <div class="mb-2">
                        <select v-model="title">
                            <option v-for="(incomeType, k, index) in incomeTypes" :key="index" :value="incomeType">{{ incomeType }}</option>
                        </select>
                    </div>
                    <label class="block text-sm font-bold mb-2">Antal kronor/månad</label>
                    <div  class="mb-4">
                        <input class="m-aut input-text w-3/5" type="text" v-model="income" placeholder="SEK"/>
                    </div>
                    <button class="btn btn-teal mr-1" @click="addIncome">Lägg till</button>
                    <button class="btn btn-orange" @click="cleanForm">Avbryt</button>
                </div>
            </transition>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { Income } from '../../models/Income';

const incomeTypes = [
    'Lön',
    'Pension',
    'Övrig inkomst',
];

export default {
    data: function () {
        return {
            adding: false,
            title: incomeTypes[0],
            income: null,
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
        ...mapActions([
            'addToast',
        ]),
        addIncome: function () {
            if (! this.title || ! this.income) {
                this.adding = false;
                return;
            }
            const vm = this;

            Income.create({
                income: this.income,
                personId: this.personId,
                title: this.title,
            }).then(function () {
                vm.cleanForm();
                console.log('done!');
            }).catch((e) => this.addToast({ type: 'error', message: e.message }));
        },
        cleanForm: function () {
            this.title = incomeTypes[0];
            this.income = null;
            this.adding = false;
        },
        numberWithSpaces (x) {
            const numberFormatter = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 });
            return numberFormatter.format(x);
        },
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
};
</script>
