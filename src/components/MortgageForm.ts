import { getState, setState, subscribe } from '../state';
import { formatCurrency, formatInput, parseInput } from '../utils/formatters';
import { calculateMortgage } from '../calculators/mortgageCalc';

export function setupMortgageForm(container: HTMLElement, resultContainer: HTMLElement) {
    const render = () => {
        const state = getState();
        const mortgageResult = calculateMortgage(state);

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${createInput('purchasePrice', 'Cena nemovitosti (Kč)', state.purchasePrice)}
                ${createInput('rpsn', 'Úroková sazba (%)', state.rpsn)}
                ${createInput('ltv', 'LTV (%)', state.ltv)}
                ${createInput('loanTerm', 'Doba splácení (roky)', state.loanTerm)}
            </div>
        `;

        // Bind events
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const rawValue = target.value;
                let value = parseInput(rawValue);
                const key = target.name as any;

                // Value Boundaries
                if (key === 'rpsn' || key === 'ltv') {
                    if (value > 100) {
                        value = 100;
                        target.value = formatInput(100);
                    }
                } else if (key === 'loanTerm') {
                    if (value > 35) {
                        value = 35;
                        target.value = formatInput(35);
                    }
                }

                // Logic to sync Loan Amount
                if (key === 'purchasePrice') {
                    const ltv = getState().ltv;
                    const loanAmount = value * (ltv / 100);
                    setState('loanAmount', loanAmount);
                }
                if (key === 'ltv') {
                    const price = getState().purchasePrice;
                    const loanAmount = price * (value / 100);
                    setState('loanAmount', loanAmount);
                }

                setState(key, value);
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

        // Update Result
        resultContainer.innerHTML = `
            <div class="grid grid-cols-2 gap-4 text-center">
                <div>
                    <h3 class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Měsíční splátka</h3>
                    <p class="text-2xl font-bold text-primary mt-1">${formatCurrency(mortgageResult.monthlyPayment)}</p>
                </div>
                <div>
                    <h3 class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Zaplaceno celkem</h3>
                    <p class="text-lg font-medium text-slate-700 mt-2">${formatCurrency(mortgageResult.totalPaid)}</p>
                </div>
            </div>
        `;
    };

    // Initial render
    render();

    // Subscribe to changes
    subscribe(() => {
        updateFormValues(container);

        // Always re-render results
        const state = getState();
        const mortgageResult = calculateMortgage(state);
        resultContainer.innerHTML = `
            <div class="grid grid-cols-2 gap-4 text-center">
                <div>
                    <h3 class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Měsíční splátka</h3>
                    <p class="text-2xl font-bold text-primary mt-1">${formatCurrency(mortgageResult.monthlyPayment)}</p>
                </div>
                <div>
                    <h3 class="text-xs font-semibold uppercase text-slate-500 tracking-wider">Zaplaceno celkem</h3>
                    <p class="text-lg font-medium text-slate-700 mt-2">${formatCurrency(mortgageResult.totalPaid)}</p>
                </div>
            </div>
        `;
    });
}

function createInput(name: string, label: string, value: number): string {
    return `
        <div class="flex flex-col space-y-1">
            <label for="${name}" class="text-sm font-medium text-slate-600">${label}</label>
            <input 
                type="text" 
                inputmode="decimal"
                id="${name}" 
                name="${name}" 
                value="${formatInput(value)}" 
                class="block w-full rounded-lg border-slate-300 bg-slate-50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border transition-colors outline-none"
            >
        </div>
    `;
}

function updateFormValues(container: HTMLElement) {
    const state = getState();
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
        const key = input.name as keyof typeof state;
        const stateValue = state[key];

        // Only update if not focused to avoid jumping cursor
        if (document.activeElement !== input) {
            // Compare parsed values to avoid unnecessary updates
            const currentInputValue = parseInput(input.value);
            if (typeof stateValue === 'number') {
                if (currentInputValue !== stateValue) {
                    input.value = formatInput(stateValue);
                }
            }
        }
    });
}
