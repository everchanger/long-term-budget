import Vue from 'vue';
import Vuex from 'vuex';
import api from './api';
import { Income } from './models/Income';
import { FINANCIAL_TYPES } from './models/FinancialBase';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        user: {
            id: null,
            alias: null,
            email: null,
        },
        persons: {
            /* Each entry has:
                id: null,
                name: null,
                income: [],
                expenses: [],
                loans: [],
                savings: [],
            */
        },
        income: {},
        expenses: {},
        loans: {},
        savings: {},
        toasts: [],
        toastTimeout: 5000,
    },
    getters: {
        userAlias: state => state.user.alias,
        persons: state => state.persons,
        personIncome: state => function (personId) {
            console.log('personId ' + personId);
            if (! state.persons.hasOwnProperty(personId)) {
                console.log('out');
                return [];
            }
            console.log('in');
            return state.persons[personId].income.map(incomeId => state.income[incomeId]);
        },
        personExpenses: state => function (personId) {
            return [];
        },
        personLoans: state => function (personId) {
            return [];
        },
        personSavings: state => function (personId) {
            return [];
        },
        income: state => function (incomeId) {
            return state.income[incomeId];
        },
        expense: state => function (expenseId) {
            return state.expenses[expenseId];
        },
        toasts: state => state.toasts,
    },
    mutations: {
        addPerson (state, person) {
            Vue.set(state.persons, person.id, { id: person.id, name: person.name });
            Vue.set(state.persons[person.id], 'income', []);
        },
        updateUser (state, user) {
            state.user = { id: user.id, alias: user.alias, email: user.email };

            // Probably reset the person/income state as well before refilling?

            // Normalize the user data
            for (const person of user.persons) {
                Vue.set(state.persons, person.id, { id: person.id, name: person.name });
                Vue.set(state.persons[person.id], 'income', []);
                for (const income of person.income) {
                    const instance = new Income(income.id, income.income, income.person_id, income.title);
                    Vue.set(state.income, instance.id, instance);
                    state.persons[person.id].income.push(instance.id);
                }
            }
        },
        addFinancialData (state, data) {
            switch (data.type) {
            case FINANCIAL_TYPES.INCOME:
                const income = new Income(data.response.id, data.response.income, data.response.person_id, data.response.title);
                Vue.set(state.income, income.id, income);
                state.persons[income.personId].income.push(income.id);
                break;
            case 'expense':
                break;
            case 'loan':
                break;
            case 'savings':
                break;
            }
        },
        updateFinancialData (state, data) {
            switch (data.instance.type) {
            case FINANCIAL_TYPES.INCOME:
                const instance = new Income(data.response.id, data.response.income, data.response.person_id, data.response.title);
                Vue.set(state.income, instance.id, instance);
                break;
            case 'expense':
                break;
            case 'loan':
                break;
            case 'savings':
                break;
            }
        },
        deleteFinancialData (state, data) {
            switch (data.instance.type) {
            case FINANCIAL_TYPES.INCOME:
                // We should remove the incomeId from the income state, and from the persons state
                Vue.set(state.income, data.instance.id, null);
                const person = state.persons[data.instance.personId];
                const position = person.income.indexOf(data.id);
                person.income.splice(position, 1);
                break;
            }
        },
        addToast (state, data) {
            state.toasts.push(data);
        },
        shiftToasts (state) {
            state.toasts.shift();
        },
    },
    actions: {
        addPerson ({ commit, state }, name) {
            // This should do a ajax request to the backend to add the person.
            const currentLength = Object.keys(state.persons).length;
            const id = state.persons[currentLength].id + 1;
            const person = {
                id: id,
                name: name,
                data: null,
            };
            commit('addPerson', person);
        },
        refreshUser ({ commit }) {
            api.users().then((user) => {
                // Store the income, expenses, loans and savings
                commit('updateUser', user);
            });
        },
        addFinancialData ({ commit }, data) {
            switch (data.type) {
            case FINANCIAL_TYPES.INCOME:
                commit('addFinancialData', { type: data.type, response: data.data });
                break;
            case 'expense':
                break;
            case 'loan':
                break;
            case 'savings':
                break;
            }
        },
        updateFinancialData ({ commit }, data) {
            switch (data.instance.type) {
            case FINANCIAL_TYPES.INCOME:
                commit('updateFinancialData', { instance: data.instance, response: data.data });
                break;
            case 'expense':
                break;
            case 'loan':
                break;
            case 'savings':
                break;
            }
        },
        deleteFinancialData ({ commit }, data) {
            switch (data.instance.type) {
            case FINANCIAL_TYPES.INCOME:
                console.log('in action');
                commit('deleteFinancialData', { instance: data.instance });
                break;
            case 'expense':
                break;
            case 'loan':
                break;
            case 'savings':
                break;
            }
        },
        addToast ({ state, commit }, data) {
            if (! data.type || ! data.message) {
                data = { type: 'error', message: 'Felaktig toast..' };
            }
            commit('addToast', data);
            setTimeout(() => {
                commit('shiftToasts');
            }, state.toastTimeout);
        },
    },
});
