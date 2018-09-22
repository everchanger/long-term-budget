import { shallowMount, createLocalVue } from '@vue/test-utils';

import '@/components';
import toast from '@/components/toast.vue';

const localVue = createLocalVue();

describe('toast.vue', () => {
	let wrapper;
	const toastMessage = 'Testing a toast!';

	beforeEach(() => {
		wrapper = shallowMount(toast, {
			localVue,
			propsData: {
				message: toastMessage,
			},
		});
	});

	it('shows text in toast', () => {
		const toast = wrapper.find('.toast');
		expect(toast.text()).toMatch(toastMessage);
	});
});
