import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import '@/components';
import Router from 'vue-router';

import sidebar from '@/views/sidebar.vue';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(Router);

describe('sidebar.vue', () => {
	let wrapper;
	let getters, actions, store;

	beforeEach(() => {
		getters = {
			persons: function () {
				return {
					1: {
						id: 1,
						name: 'Test Testson 1',
					},
					2: {
						id: 2,
						name: 'Test Testson 2',
					},
				};
			},
		};

		actions = {
			addPerson: jest.fn(),
		};

		store = new Vuex.Store({
			getters,
			actions,
		});

		wrapper = shallowMount(sidebar, { store, localVue });
	});

	it('renders a list of persons', () => {
		const persons = wrapper.findAll('.person');
		for (let i = 0; i < persons.length; ++i) {
			const person = persons.wrappers[i];
			const personName = getters.persons()[i + 1].name;
			expect(person.text()).toMatch(personName);
		}
	});

	it('adds a person to the sidebar', () => {
		const newName = 'Test Testson 3';

		const showButton = wrapper.find('#showInput');
		showButton.trigger('click');

		const personNameInput = wrapper.find('#personName');
		personNameInput.setValue(newName);
		personNameInput.trigger('input');

		expect(wrapper.vm.personName).toMatch(newName);

		const addButton = wrapper.find('#add');
		addButton.trigger('click');

		expect(actions.addPerson).toHaveBeenCalled();
	});

	it('tries to add a person with no name', () => {
		const showButton = wrapper.find('#showInput');
		showButton.trigger('click');

		const addButton = wrapper.find('#add');
		addButton.trigger('click');

		expect(actions.addPerson).not.toHaveBeenCalled();
	});
});
