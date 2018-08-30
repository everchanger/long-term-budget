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
    },
    addIncome (personId, title, income) {
        const data = { personId: personId, title: title, income: income };
        return new Promise((resolve) => {
            Vue.http.post('income', data, { emulateJSON: true, emulateHTTP: true }).then((response) => {
                // Error handling much?
                var obj = JSON.parse(response.bodyText);
                resolve(obj);
            });
        });
    },
    updateIncome (incomeId, income) {
        const data = { income: income };
        const url = 'income/' + incomeId;
        return new Promise((resolve) => {
            Vue.http.post(url, data, { emulateJSON: true, emulateHTTP: true }).then((response) => {
                // Error handling much?
                var obj = JSON.parse(response.bodyText);
                resolve(obj);
            });
        });
    }
}