import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import Router from 'vue-router';

import '@/components';
import root from '@/root.vue';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(Router);

describe('root.vue', () => {
    let wrapper;
    let actions, getters, store;

    beforeEach(() => {
        jest.useFakeTimers();
        actions = {
            refreshUser: jest.fn(),
        };

        getters = {
            toasts () {
                return [{
                    type: 'success',
                    message: 'Test toast',
                }];
            },
            persons () {
                return [];
            },
        };

        store = new Vuex.Store({
            actions,
            getters,
        });

        wrapper = mount(root, { store, localVue, stubs: ['router-link', 'router-view'] });
    });

    afterEach(() => {
        jest.runAllTimers();
    });

    it('display a toast', () => {
        const toast = wrapper.find('.toast');
        expect(toast.text()).toBe(getters.toasts()[0].message);
    });
});
