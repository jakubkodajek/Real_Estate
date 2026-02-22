import { getState, setState, subscribe } from '../state';
import { formatInput, parseInput } from '../utils/formatters';

export function setupInvestmentForm(container: HTMLElement) {
    const render = () => {
        const state = getState();

        // Sections
        const priceInputs = `
            <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Ceny & Nájem</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                ${createInput('purchasePrice', 'Kupní cena (Kč)', state.purchasePrice)}
                ${createInput('marketPrice', 'Tržní cena (Kč)', state.marketPrice)}
                ${createInput('ownCash', 'Vlastní hotovost (Kč)', state.purchasePrice - state.loanAmount)}
                ${createInput('monthlyRent', 'Měsíční nájem (Kč)', state.monthlyRent)}
            </div>
        `;

        const oneTimeInputs = `
            <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Jednorázové náklady</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                ${createInput('agentCommission', 'Provize (Kč)', state.agentCommission)}
                ${createInput('acquisitionTax', 'Daň z nabytí (Kč)', state.acquisitionTax)}
                ${createInput('renovationCost', 'Rekonstrukce (Kč)', state.renovationCost)}
            </div>
        `;

        const operatingInputs = `
            <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Roční výdaje</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                ${createInput('repairFund', 'Fond oprav (Kč/měs)', state.repairFund)}
                ${createInput('propertyInsurance', 'Pojištění (Kč/rok)', state.propertyInsurance)}
                ${createInput('propertyTax', 'Daň z nem. (Kč/rok)', state.propertyTax)}
                ${createInput('otherCosts', 'Ostatní (Kč/rok)', state.otherCosts)}
                ${createInput('incomeTaxRate', 'Daň z příjmu (%)', state.incomeTaxRate)}
            </div>
        `;

        const marketInputs = `
            <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Předpoklady trhu</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                ${createInput('propertyGrowthRate', 'Růst ceny nem. (%)', state.propertyGrowthRate)}
                ${createInput('rentGrowthRate', 'Růst nájmu (%)', state.rentGrowthRate)}
                ${createInput('inflationRate', 'Inflace (%)', state.inflationRate)}
                ${createInput('holdingPeriod', 'Doba držení (roky)', state.holdingPeriod)}
                ${createInput('occupancyRate', 'Obsazenost (%)', state.occupancyRate)}
            </div>
        `;

        container.innerHTML = `
            <div class="space-y-6">
                ${priceInputs}
                <hr class="border-slate-100">
                ${oneTimeInputs}
                <hr class="border-slate-100">
                ${operatingInputs}
                <hr class="border-slate-100">
                ${marketInputs}
            </div>
        `;

        // Bind events
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;

                // Povolit pouze číslice, mezeru, tečku a čárku (vyfiltruje mínus i písmena)
                const filteredValue = target.value.replace(/[^0-9.,\s]/g, '');
                if (target.value !== filteredValue) {
                    target.value = filteredValue;
                }

                let value = parseInput(target.value);
                const key = target.name as any;

                // Prevent negative numbers
                if (value < 0) {
                    value = 0;
                    target.value = formatInput(0);
                }

                // Percentage and Year limits
                const percentageKeys = ['incomeTaxRate', 'propertyGrowthRate', 'rentGrowthRate', 'inflationRate', 'occupancyRate'];
                if (percentageKeys.includes(key) || key === 'holdingPeriod') {
                    if (value > 100) {
                        value = 100;
                        target.value = formatInput(100);
                    }
                }

                if (key === 'ownCash') {
                    // Recalculate Loan Amount and LTV
                    // Own Cash = Purchase Price - Loan Amount
                    const currentPrice = getState().purchasePrice;

                    // Vlastní hotovost nesmí přesáhnout kupní cenu
                    if (value > currentPrice) {
                        value = currentPrice;
                        target.value = formatInput(currentPrice);
                    }

                    const newLoanAmount = currentPrice - value;

                    // Update Loan Amount
                    setState('loanAmount', newLoanAmount);

                    // Update LTV
                    // LTV = (Loan Amount / Purchase Price) * 100
                    if (currentPrice > 0) {
                        const newLtv = (newLoanAmount / currentPrice) * 100;
                        setState('ltv', newLtv);
                    }
                } else if (key === 'purchasePrice') {
                    // If purchase price changes, we need to decide what keeps constant: LTV or Loan Amount?
                    // Usually LTV is constant, so Loan Amount updates.
                    // The simple setState here will trigger loan update in MortgageForm logic if they are linked, 
                    // but here we just set the price. MortgageForm listener handles the sync?
                    // Wait, InvestmentForm doesn't have the MortgageForm logic.
                    // MortgageForm has: if purchasePrice changes -> update loanAmount based on current LTV.
                    // But MortgageForm might not be active/rendered? It is rendered in main.ts.
                    // So setting state here is fine, MortgageForm logic (or a central logic) should handle it.
                    // BUT: calculateMortgage uses state.loanAmount. 
                    // We should probably sync loan amount here too if we want immediate feedback in this form's interactions?
                    // Actually, if MortgageForm is on the page, its listeners only fire if the input there fires event. 
                    // Programmatic setState does NOT trigger input events on other inputs.
                    // So we need to update dependent state here too if we want consistency.

                    // Standard behavior: Keep LTV constant, update Loan Amount
                    const ltv = getState().ltv;
                    const newLoanAmount = value * (ltv / 100);
                    setState('loanAmount', newLoanAmount);
                    setState(key, value);
                } else {
                    setState(key, value);
                }
            });

            input.addEventListener('blur', (e) => {
                const target = e.target as HTMLInputElement;
                const value = parseInput(target.value);
                target.value = formatInput(value);
            });

            input.addEventListener('focus', (e) => {
                const target = e.target as HTMLInputElement;
                const value = parseInput(target.value);
                target.value = value.toString();
                target.select();
            });
        });
    };

    render();

    subscribe(() => {
        updateFormValues(container);
    });
}

function createInput(name: string, label: string, value: number): string {
    return `
        <div class="flex flex-col space-y-1">
            <label for="${name}" class="text-xs font-medium text-slate-500 uppercase">${label}</label>
            <input
                type="text"
                inputmode="decimal"
                id="${name}"
                name="${name}"
                value="${formatInput(value)}"
                class="block w-full rounded-md border-slate-200 bg-slate-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border transition-colors outline-none"
            >
        </div>
    `;
}

function updateFormValues(container: HTMLElement) {
    const state = getState();
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
        const key = input.name as keyof typeof state | 'ownCash';
        let stateValue: number | string | undefined;

        if (key === 'ownCash') {
            stateValue = state.purchasePrice - state.loanAmount;
        } else {
            stateValue = state[key as keyof typeof state];
        }

        if (document.activeElement !== input) {
            const currentInputValue = parseInput(input.value);
            // stateValue can be string (projectName), but these inputs are numbers.
            // We can cast stateValue to number or check type.
            if (typeof stateValue === 'number') {
                if (currentInputValue !== stateValue) {
                    input.value = formatInput(stateValue);
                }
            } else {
                // Should not happen for number inputs
            }
        }
    });
}
