'use strict';

import api from '../api';
import store from '../store';

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
    }

    static url () {
        return '';
    }

    static create (ChildClass, args) {
        const instance = new ChildClass();
        for (const key in instance) {
            if (key === 'id' || key === 'type') {
                continue;
            }
            if (! args.hasOwnProperty(key)) {
                return new Promise((resolve, reject) => reject(new Error('Saknar data för att skapa instans: "' + key + '"')));
            }
        }

        return new Promise((resolve) => {
            api.add(ChildClass.url(), args).then(response => {
                store.dispatch('addFinancialData', { type: ChildClass.type(), data: response });
                resolve(response);
            });
        });
    }

    update (data) {
        // Replace instance data with the data in the data argument.
        for (const key in data) {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }

        const args = {};
        for (const key in this) {
            args[key] = this[key];
        }

        return new Promise((resolve) => {
            api.update(this.url(), args).then(response => {
                store.dispatch('updateFinancialData', { instance: this, data: response });
                resolve();
            });
        });
    }

    remove () {
        return new Promise((resolve) => {
            api.remove(this.url(), {
                id: this.id,
            }).then(response => {
                store.dispatch('deleteFinancialData', { instance: this, data: response });
                resolve();
            });
        });
    }
}
