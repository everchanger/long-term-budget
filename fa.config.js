import Vue from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import { faTimesCircle, faTimes, faExclamationTriangle, faCommentAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
// import { faUserCircle, faCheckCircle } from '@fortawesome/free-regular-svg-icons';

library.add(
	faTimes,
	faTimesCircle,
	faExclamationTriangle,
	faCommentAlt,
	faCheckCircle,
);

Vue.component('font-awesome-icon', FontAwesomeIcon);
