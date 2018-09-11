<template>
	<div class="h-full w-1/4 float-left p-1 bg-grey-light text-grey-dark">
		<h3 class="font-bold mb-2">Hushåll</h3>
		<div class="person" v-for="person of persons" :key="person.id">
			<router-link :to="'/collector/' + person.id" tag="button" class="btn btn-indigo mb-1 w-full" @click="setActivePerson(person.id)">{{ person.name }}</router-link>
		</div>
		<transition name="fade-fast" mode="out-in">
			<button v-if="! adding" id="showInput" class="btn btn-teal mb-2 mt-1 w-full" @click="adding = ! adding;">Lägg till person</button>
			<div v-else class="p-2">
				<input id="personName" class="input-text mb-2" placeholder="Namn" v-model="personName" />
				<button id="add" class="btn btn-teal mr-1" @click="add">Lägg till</button>
				<button class="btn btn-orange" @click="adding = false; personName = null">Avbryt</button>
			</div>
		</transition>
	</div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { bus } from '../event-bus.js';

export default {
	data: function () {
		return {
			adding: false,
			personName: null,
		};
	},
	computed: {
		...mapGetters([
			'persons',
		]),
	},
	methods: {
		...mapActions([
			'addPerson',
		]),
		add: function () {
			if (!this.personName) {
				bus.$emit('alert', 'Skriv in ett namn för att skapa en ny person!');
				return;
			}
			this.addPerson(this.personName);
			this.personName = null;
			setTimeout(() => {
				this.adding = false;
			}, 250);
		},
	},
};
</script>
