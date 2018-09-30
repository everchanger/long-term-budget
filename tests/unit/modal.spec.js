import { shallowMount, createLocalVue } from '@vue/test-utils';

import '@/components';
import modal from '@/components/modal.vue';

const localVue = createLocalVue();

describe('modal.vue', () => {
    let wrapper;

    const headerText = 'Header';
    const messageText = 'Header';
    const okText = 'Header';
    const cancelText = 'Header';

    beforeEach(() => {
        wrapper = shallowMount(modal, {
            localVue,
            slots: {
                header: '<h2 id="header">' + headerText + '</h2>',
                message: '<p id="message">' + messageText + '</p>',
                ok: '<button id="ok">' + okText + '</button>',
                cancel: '<button id="cancel" @click="showWarning = false">' + cancelText + '</button>',
            },
        });
    });

    it('check modal header', () => {
        wrapper.setProps({ value: true });
        const elm = wrapper.find('#header');
        expect(elm.text()).toMatch(headerText);
    });

    it('check modal message', () => {
        wrapper.setProps({ value: true });
        const elm = wrapper.find('#message');
        expect(elm.text()).toMatch(messageText);
    });

    /*	it('press ok button', () => {
		wrapper.setProps({ value: true });
		const elm = wrapper.find('#ok');
		elm.trigger('click');
		expect(wrapper.vm.value).toBe(false);
	});

	it('press cancel button', () => {
		wrapper.setProps({ value: true });
		const elm = wrapper.find('#cancel');
		elm.trigger('click');
		expect(wrapper.vm.value).toBe(false);
	});

	it('click close', () => {
		wrapper.setProps({ value: true });
		const closeElm = wrapper.find('#close');
		closeElm.trigger('click');
		expect(wrapper.vm.value).toBe(false);
	});

	it('mouse click on document', () => {
		wrapper.setProps({ value: true });
		const backgroundElm = wrapper.find('.fixed');
		backgroundElm.trigger('click');
		expect(wrapper.vm.value).toBe(false);
	}); */
});
