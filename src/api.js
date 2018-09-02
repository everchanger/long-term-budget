import aja from 'aja'

const baseurl = 'http://localhost/api.php/'

export default {
    users () {
        return new Promise((resolve) => {
            aja()
            .url(baseurl + 'users/1')
            .on('success', function (data){
                console.log(data);    
                resolve(data);
            })
            .go();
        });
    },
    addIncome (personId, title, income) {
        const data = { personId: personId, title: title, income: income };
        return new Promise((resolve) => {
            aja()
            .method('POST')
            .data(data)
            .url(baseurl + 'income')
            .on('success', function (data){
                console.log(data);    
                resolve(data);
            })
            .go();
        });
    },
    updateIncome (incomeId, income) {
        const data = { income: income };
        const url = baseurl + 'income/' + incomeId;
        return new Promise((resolve) => {
            aja()
            .method('POST')
            .data(data)
            .url(url)
            .on('success', function (data){
                console.log(data);    
                resolve(data);
            })
            .go();
        });
    },
    removeIncome (incomeId) {
        const url = baseurl + 'income/' + incomeId;
        return new Promise((resolve) => {
            aja()
            .method('DELETE')
            .url(url)
            .on('success', function (data){
                console.log(data);    
                resolve(data);
            })
            .go();
        });
    }
}