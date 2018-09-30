'use strict';

import { FINANCIAL_TYPES, FinancialBase } from './FinancialBase';

export class Income extends FinancialBase {
    constructor (id, income, personId, title) {
        super(Income.type());

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

    url () {
        return 'income';
    }

    static create (data) {
        return FinancialBase.create(this, data);
    }
}
