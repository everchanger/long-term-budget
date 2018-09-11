import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import Router from 'vue-router';
import { bus } from '@/event-bus.js';

import '@/components';
import root from '@/root.vue';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(Router);

describe('root.vue', () => {
	let wrapper;
	let actions, store;

	beforeEach(() => {
		jest.useFakeTimers();
		actions = {
			refreshUser: jest.fn(),
		};

		store = new Vuex.Store({
			actions,
		});

		wrapper = shallowMount(root, { store, localVue });
	});

	afterEach(() => {
		jest.runAllTimers();
	});

	it('shows an alert', () => {
		const alertMsg = 'Testing alert!';
		bus.$emit('alert', alertMsg);
		const alertElement = wrapper.find('#alert-message');
		expect(alertElement.text()).toMatch(alertMsg);
	});
});
