import aja from 'aja';

const baseurl = 'http://localhost/api.php/';

export default {
	users () {
		return new Promise((resolve) => {
			aja()
				.url(baseurl + 'users/1')
				.on('success', function (data) {
					console.log(data);
					resolve(data);
				})
				.go();
		});
	},
	add (url, data) {
		return new Promise((resolve) => {
			aja()
				.method('POST')
				.data(data)
				.url(baseurl + url)
				.on('success', function (data) {
					console.log(data);
					resolve(data);
				})
				.go();
		});
	},
	update (url, data) {
		const fullUrl = baseurl + url + '/' + data.id;
		return new Promise((resolve) => {
			aja()
				.method('POST')
				.data(data)
				.url(fullUrl)
				.on('success', function (data) {
					console.log(data);
					resolve(data);
				})
				.go();
		});
	},
	remove (url, data) {
		const fullUrl = baseurl + url + '/' + data.id;
		return new Promise((resolve) => {
			aja()
				.method('DELETE')
				.url(fullUrl)
				.on('success', function (data) {
					console.log(data);
					resolve(data);
				})
				.go();
		});
	},
};
