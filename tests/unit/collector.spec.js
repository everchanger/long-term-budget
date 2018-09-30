import { shallowMount, createLocalVue } from '@vue/test-utils';

import '@/components';
import collector from '@/views/collector.vue';

const localVue = createLocalVue();

describe('collector.vue', () => {
    let wrapper;
    const id = 1;

    beforeEach(() => {
        const $route = {
            params: {
                id: id,
            },
        };
        wrapper = shallowMount(collector, {
            localVue,
            mocks: {
                $route,
            },
        });
    });

    it('check route', () => {
        const elm = wrapper.find('h2');
        expect(elm.text()).toMatch('Person ' + id);
    });
});
