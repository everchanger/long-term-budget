'use strict';

import { FINANCIAL_TYPES, FinancialBase } from './FinancialBase';
import api from '../api';
import store from '../store';

export class Income extends FinancialBase {
	constructor (id, income, personId, title) {
		super(FINANCIAL_TYPES.INCOME, 'income');
		this.personId = personId;
		this.title = title;
		this.income = income;
		this.id = id;
	}

	static type () {
		return FINANCIAL_TYPES.INCOME;
	}

	static url () {
		return 'income';
	}

	static create (income, personId, title) {
		return new Promise((resolve) => {
			api.add(Income.url(), {
				personId: personId,
				title: title,
				income: income,
			}).then(response => {
				store.dispatch('addFinancialData', { type: Income.type(), data: response });
				resolve();
			});
		});
	}

	update (income) {
		return new Promise((resolve) => {
			api.update(Income.url(), {
				id: this.id,
				personId: this.personId,
				title: this.title,
				income: income,
			}).then(response => {
				store.dispatch('updateFinancialData', { instance: this, data: response });
				resolve();
			});
		});
	}

	remove () {
		return new Promise((resolve) => {
			api.remove(Income.url(), {
				id: this.id,
			}).then(response => {
				store.dispatch('deleteFinancialData', { instance: this, data: response });
				resolve();
			});
		});
	}
}
