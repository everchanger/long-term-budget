<template>
	<div class="h-full bg-grey-light text-grey-dark p-1">
		<h2 class="mb-2 ">Person {{ $route.params.id }}</h2>
		<div class="w-1/2 float-left pr-1">
			<income-form :personId="personId" class="mb-2"/>
			<div class="border-2 border-grey-dark p-2 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Lån</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(0) }}</h3>
				</div>
				<loan-form :personId="personId" />
			</div>
		</div>
		<div class="w-1/2 float-left">
			<div class="border-2 border-grey-dark mb-4 p-2 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Utgifter</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(0) }} kr/månad</h3>
				</div>
				<expense-form :personId="personId" />
			</div>
			<div class="border-2 border-grey-dark p-2 w-full rounded shadow-md">
				<div class="h-8">
					<h3 class="text-grey-darker mb-2 float-left">Sparande</h3>
					<h3 class="text-grey-darker mb-2 float-right">{{ monthlySum(0) }}</h3>
				</div>
				<savings-form :personId="personId" />
			</div>
		</div>
	</div>
</template>

<script>

export default {
    computed: {
        personId () {
            return Number(this.$route.params.id);
        },
    },
    methods: {
        monthlySum (values) {
            return values;
        },
    },
};
</script>
