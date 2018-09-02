<template>
    <div v-if="value" ref="modal" class="fixed flex items-center justify-center pin-t pin-r h-full w-full" style="background-color: rgba(0.1, 0.1, 0.1, 0.8) !important">
        <div class="relative bg-white text-grey-dark border-red-light p-3 rounded w-1/2">
        <button @click="close" class="absolute btn btn-red mr-0 rounded-full h-8 w-8 font-bold p-1" style="top: -10px; right: -10px;">X</button>
            <div class="mb-2 text-grey-darker" >
                <slot name="header"></slot>
            </div>
            <div class="mb-4">
                <slot name="message"></slot>
            </div>
            <div class="float-right">
                <slot name="ok"></slot>
                <slot name="cancel"></slot>
            </div>
        </div>
    </div>
</template>

<script>

import { bus } from '../event-bus.js';

export default {
    props: ['value'],
    methods: {
		close () {
            this.$emit('input', false);
        },
        click (event) {
            const srcElement = event.srcElement;
            if (srcElement === this.$refs.modal) {
                this.close();
                return;
            }
        }
    },
    mounted () {
        document.addEventListener('click', this.click);
    },
    destroyed () {
        document.removeEventListener('click', this.click);
    }
}

</script>
