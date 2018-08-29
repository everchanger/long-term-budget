<template>
	<div class="h-full w-1/4 float-left p-4 bg-grey-light text-grey-darker">
		<h3 class="font-bold mb-2">Hushåll</h3>
		<div v-for="person of persons" :key="person.id">
			<router-link :to="'/collector/' + person.id" tag="button" class="btn btn-orange-inverted mb-2" @click="setActivePerson(person.id)">{{ person.name }}</router-link>
		</div>
		<button class="btn btn-blue mb-2" @click="adding = true">Lägg till person</button>
		<transition name="fade">
			<div v-if="adding">
				<input class="input-text mb-2" placeholder="Namn" v-model="personName" />
				<button class="btn btn-blue mr-1" @click="add">OK</button>
				<button class="btn btn-red" @click="adding = false; personName = null">Avbryt</button>
			</div>
		</transition>
	</div>
</template>

<script>
import { mapActions } from 'vuex'
import { bus } from '../event-bus.js';

export default {
	data: function () {
		return {
			adding: false,
			personName: null,
		}
	},
	computed: {
		persons () {
			return this.$store.state.persons;
		},
	},
	methods: {
		...mapActions([
			'addPerson'
		]),
		add: function () {
			if (! this.personName) {
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
}
</script>
