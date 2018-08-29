import Vue from 'vue'

export default {
    users () {
        return new Promise((resolve) => {
            Vue.http.get('users/1').then((response) => {
                // Error handling much?
                var obj = JSON.parse(response.bodyText);
                resolve(obj);
            });
        });
    }
}