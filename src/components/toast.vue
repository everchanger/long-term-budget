<template>
    <div class="toast mb-2 shadow-md text-white p-2 flex justify-between " :class="bgColor">
        <font-awesome-icon :icon="icon"></font-awesome-icon>
		<span class="w-4/5 mr-4">{{ message }}</span>
		<font-awesome-icon icon="times"></font-awesome-icon>
    </div>
</template>

<script>

export default {
    props: {
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: false,
            default: '',
        },
    },
    computed: {
        bgColor: function () {
            return {
                'bg-red': this.type === 'error',
                'bg-orange': this.type === 'warning',
                'bg-indigo': this.type === 'status' || this.type === '',
                'bg-green': this.type === 'success',
            };
        },
        icon: function () {
            switch (this.type) {
            case 'error':
                return 'times-circle';
            case 'warning':
                return 'exclamation-triangle';
            case 'success':
                return 'check-circle';
            case 'status':
            case '':
            default:
                return 'comment-alt';
            }
        },
    },
};

</script>
