import Vue from 'vue'
import Vuex from 'vuex'
import api from './api'

Vue.use(Vuex)

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
	},
	getters: {
		userAlias: state => {
			return state.user.alias;
		},
		personIncome: (state => function (personId) {
			console.log('personId ' + personId)
			if (! state.persons.hasOwnProperty(personId)) {
				console.log('out')
				return [];
			}
			console.log('in')
			return  state.persons[personId].income.map(incomeId => state.income[incomeId]);
		}),
		personExpenses: (state => function (personId) {
			return [];
		}),
		personLoans: (state => function (personId) {
			return [];
		}),
		personSavings: (state => function (personId) {
			return [];
		}),
	},
	mutations: {
		addPerson (state, person) {
			state.persons.push(person);
		},
		updateUser (state, user) {
			state.user = {id: user.id, alias: user.alias, email: user.email};

			// Probably reset the person/income state as well before refilling?

			// Normalize the user data
			for (const person of user.persons) {
				Vue.set(state.persons, person.id, {id: person.id, name: person.name});
				Vue.set(state.persons[person.id], 'income', []);
				for (const income of person.income) {
					Vue.set(state.income, income.id, income);
					state.persons[person.id].income.push(income.id);
				}
			}
		},
		addIncome (state, income) {
			Vue.set(state.income, income.id, income);
			state.persons[income.person_id].income.push(income.id);
		},
		updateIncome (state, income) {
			Vue.set(state.income, income.id, income);
		},
		removeIncome (state, incomeId) {
			// We should remove the incomeId from the income state, and from the persons state
			Vue.set(state.income, incomeId, null);

			// Find the id in the persons state
			for (const personId in state.persons) {
				const person = state.persons[personId];
				const newIncome = person.income.filter(function (item) {
					if (item === incomeId) {
						return false;
					}
					return true;
				});

				if (newIncome.length === person.income.length) {
					continue;
				}
				person.income = newIncome;
			}
		},
	},
	actions: {
		addPerson ({ commit, state }, name) {
			// This should do a ajax request to the backend to add the person.
			const id = state.persons[state.persons.length - 1].id + 1;
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
		addIncome ({ commit }, data) {
			api.addIncome(data.personId, data.title, data.income).then(income => {
				commit('addIncome', income);
			});
		},
		updateIncome ({ commit }, data) {
			api.updateIncome(data.incomeId, data.income).then(income => {
				commit('updateIncome', income);
			});
		},
		deleteIncome ({ commit }, data) {
			api.removeIncome(data.incomeId).then(incomeId => {
				const id = Number(incomeId);
				commit('removeIncome', id);
			});
		}
	}
})
