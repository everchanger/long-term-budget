import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import '@/components';

import home from '@/views/home.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('home.vue', () => {
    let getters;
    let store;

    beforeEach(() => {
        getters = {
            userAlias: () => 'Test Testson',
        };

        store = new Vuex.Store({
            getters,
        });
    });

    it('renders user alias from vuex', () => {
        const headline = 'Välkommen ' + getters.userAlias() + ' till Budget!';
        const wrapper = shallowMount(home, { store, localVue });
        const elm = wrapper.find('h2');
        expect(elm.text()).toMatch(headline);
    });
});
