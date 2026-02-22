import { setState } from '../state';
import type { AppState } from '../types';

export function setupImportButton(button: HTMLButtonElement, fileInput: HTMLInputElement) {
    button.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                // We assume the structure matches our export
                // "investment" object contains "inputs" which has most of our state
                // "mortgage" object contains mortgage params

                if (json.investment && json.investment.inputs) {
                    const inputs = json.investment.inputs;
                    const financing = inputs.financing || {};
                    const oneTime = inputs.oneTimeCosts || {};
                    const operating = inputs.annualOperatingCosts || {};
                    const market = inputs.marketAssumptions || {};

                    // Update state safely
                    // We iterate over keys to be sure we are hitting state keys
                    const updates: Partial<AppState> = {
                        // Project Name? Ideally we save it too. 
                        // If not in JSON, maybe use filename? 
                        // For now keep current or if we saved it in root.
                        // Let's check where we saved it. In export we didn't explicitly save top-level projectName in the struct in previous step,
                        // we only used it for filename.
                        // Wait, I should add projectName to the JSON export structure if I want to persist it fully!

                        // Mortgage
                        loanAmount: json.mortgage?.loanAmount ?? inputs.financing?.loanAmount ?? 0,
                        rpsn: json.mortgage?.rpsn ?? financing.rpsn ?? 0,
                        ltv: json.mortgage?.ltv ?? financing.ltv ?? 0,
                        loanTerm: json.mortgage?.loanTerm ?? financing.loanTerm ?? 0,

                        // Investment
                        purchasePrice: inputs.purchasePrice,
                        marketPrice: inputs.marketPrice,
                        monthlyRent: inputs.monthlyRent,

                        // One time
                        agentCommission: oneTime.agentCommission,
                        acquisitionTax: oneTime.acquisitionTax,
                        renovationCost: oneTime.renovationCost,

                        // Operating
                        // Note: repairFund in state is monthly, but export used annualized!
                        // export: repairFund: state.repairFund * 12
                        // so import: repairFund: operating.repairFund / 12
                        repairFund: (operating.repairFund || 0) / 12,
                        propertyInsurance: operating.propertyInsurance,
                        propertyTax: operating.propertyTax,
                        otherCosts: operating.otherCosts,
                        incomeTaxRate: operating.incomeTaxRate,

                        // Market
                        propertyGrowthRate: market.propertyGrowthRate,
                        rentGrowthRate: market.rentGrowthRate,
                        inflationRate: market.inflationRate,
                        holdingPeriod: market.holdingPeriod,
                        occupancyRate: market.occupancyRate,
                    };

                    // Batch update? Our setState notifies on every call. 
                    // It's better to update state one by one or add a bulkUpdate method.
                    // Given the small size, one by one is fine, just causes re-renders.
                    Object.entries(updates).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            setState(key as any, value as any);
                        }
                    });

                    // Also try to set Project Name if we saved it (I will add it to export next)
                    if (json.projectName) {
                        setState('projectName', json.projectName);
                    } else if (file.name) {
                        // Inherit from filename if missing
                        const nameFromFileName = file.name.replace('.json', '').replace(/_/g, ' ');
                        setState('projectName', nameFromFileName);
                    }

                    // Reset file input
                    fileInput.value = '';
                }
            } catch (err) {
                console.error('Failed to parse JSON', err);
                alert('Chyba při importu souboru.');
            }
        };
        reader.readAsText(file);
    });
}
