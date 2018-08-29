<template>
	<div class="h-full">
		<h2 class="mb-2 text-grey-darker">Välkommen <span v-if="$store.state.user.alias">{{ $store.state.user.alias }}</span> till Budget!</h2>
		<budget-result />
	</div>
</template>
