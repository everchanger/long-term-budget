import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)


function getData () {
	const phonyData = {
		income: [
			{
				id: 1,
				label: 'Lön',
				value: null,
			},
			{
				id: 2,
				label: 'Annan inkomst',
				value: null,
			},
		],
		expenses: [
			{
				id: 1,
				label: 'Hyra',
				value: null,
			},
			{
				id: 2,
				label: 'El',
				value: null,
			},
		],
		loans: [
			{
				id: 1,
				label: 'Bolån',
				value: null,
			},
			{
				id: 2,
				label: 'Billån',
				value: null,
			},
		],
		savings: [
			{
				id: 1,
				label: 'Månadssparande',
				value: null,
			},
			{
				id: 2,
				label: 'Pensionsparande',
				value: null,
			},
		],
	};
	return phonyData; 
}


export default new Vuex.Store({
	state: {
		persons: [
			{
				id: 1,
				name: 'Gemensamt',
				data: getData(),
			},
			{
				id: 2,
				name: 'Joakim',
				data: getData(),
			},
		],
	},
	mutations: {
		addPerson (state, person) {
			state.persons.push(person);
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
	}
})
