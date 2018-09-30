<template>
    <transition name="fade-fast" mode="out-in">
        <button v-if="! editing" class="btn btn-indigo" @click="open">{{ buttonLabel }}</button>
        <div v-else class="bg-indigo text-white p-2 rounded">
            <div class="block text-sm font-bold mb-4">
                <label>{{ fieldTitle }}</label>
                <button @click="showWarning = true" class="float-right btn btn-red mr-0 rounded-full h-8 w-8 font-bold p-1">X</button>
                <modal v-if="showWarning" v-model="showWarning">
                    <h2 slot="header">Ta bort inkomst</h2>
                    <p slot="message">Är du säker på att du vill ta bort denna inkomst?</p>
                    <button slot="ok" @click="remove" class="btn btn-teal mr-1">Ta bort</button>
                    <button slot="cancel" @click="showWarning = false" class="btn btn-orange">Avbryt</button>
                </modal>
            </div>
            <div>
                <input class="m-aut input-text w-2/5 float-left" type="text" v-model="fieldValue" placeholder="SEK"/>
                <div class="w-3/5 float-left">
                    <button class="btn btn-teal ml-2 mr-1" @click="update">Spara</button>
                    <button class="btn btn-orange" @click="close">Avbryt</button>
                </div>
                <div class="clearfix" />
            </div>
        </div>
    </transition>
</template>

<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { bus } from '../../event-bus.js';

export default {
    data: function () {
        return {
            editing: false,
            newValue: null,
            showWarning: false,
        };
    },
    props: {
        incomeId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        ...mapGetters([
            'income',
        ]),
        buttonLabel () {
            if (! this.fieldValue) {
                return this.fieldTitle;
            }
            return this.fieldTitle + ' - ' + this.fieldValue + ' kr';
        },
        field: function () {
            return this.income(this.incomeId);
        },
        fieldTitle: function () {
            return this.field.title;
        },
        fieldValue: {
            get: function () {
                return this.field.income;
            },
            set: function (value) {
                this.newValue = value;
            },
        },
    },
    methods: {
        update () {
            if (this.newValue === null || this.newValue === this.fieldValue) {
                this.editing = false;
                return;
            }

            const vm = this;
            this.field.update({ income: this.newValue }).then(function () {
                vm.editing = false;
            });
        },
        close () {
            this.editing = false;
            this.newValue = null;
        },
        open () {
            bus.$emit('field.close');
            this.editing = true;
        },
        remove () {
            const vm = this;
            /* Need to hide the modal first since it uses fixed and the transition
            when setting editing is using a transform = a new anchor will be set */
            vm.showWarning = false;
            Vue.nextTick(function () {
                vm.editing = false;
                vm.field.remove().then(function () {
                    console.log('deleted');
                });
            });
        },
    },
    mounted () {
        bus.$on('field.close', this.close);
    },
    destroyed () {
        bus.$off('field.close');
    },
};
</script>
