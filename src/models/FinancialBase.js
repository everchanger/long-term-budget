'use strict';

export const FINANCIAL_TYPES = {
	NONE: '',
	INCOME: 'income',
	EXPENSE: 'expense',
	LOAN: 'loan',
	SAVINGS: 'savings',
};

export class FinancialBase {
	constructor (type) {
		this.type = type;
		this.id = 0;
	}

	static url () {
		return '';
	}
}
