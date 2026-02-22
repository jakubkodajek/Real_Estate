import { getState } from '../state';
import { calculateMortgage } from '../calculators/mortgageCalc';
import { downloadJSON } from '../utils/exportJson';

export function setupExportButton(button: HTMLButtonElement) {
    button.addEventListener('click', () => {
        const state = getState();
        const mortgageResult = calculateMortgage(state);

        const exportData = {
            exportedAt: new Date().toISOString(),
            projectName: state.projectName,
            mortgage: {
                loanAmount: state.loanAmount,
                rpsn: state.rpsn,
                ltv: state.ltv,
                loanTerm: state.loanTerm,
                // Result values like monthlyPayment can be re-calculated, but it's small enough to keep if user wants to see results in JSON.
                // User asked: "stahuje i věci jako yearlyProjections což mi příjde zbytečné".
                // So we definitely remove yearlyProjections.
                // Keeping the basic results is fine as metadata.
                ...mortgageResult
            },
            investment: {
                inputs: {
                    purchasePrice: state.purchasePrice,
                    marketPrice: state.marketPrice,
                    monthlyRent: state.monthlyRent,
                    oneTimeCosts: {
                        agentCommission: state.agentCommission,
                        acquisitionTax: state.acquisitionTax,
                        renovationCost: state.renovationCost
                    },
                    annualOperatingCosts: {
                        repairFund: state.repairFund * 12, // Annualized
                        propertyInsurance: state.propertyInsurance,
                        propertyTax: state.propertyTax,
                        otherCosts: state.otherCosts,
                        incomeTaxRate: state.incomeTaxRate
                    },
                    marketAssumptions: {
                        propertyGrowthRate: state.propertyGrowthRate,
                        rentGrowthRate: state.rentGrowthRate,
                        inflationRate: state.inflationRate,
                        holdingPeriod: state.holdingPeriod,
                        occupancyRate: state.occupancyRate
                    },
                    financing: {
                        ltv: state.ltv,
                        rpsn: state.rpsn,
                        loanTerm: state.loanTerm
                    }
                }
                // REMOVED: yearlyProjections
            }
        };

        const safeName = state.projectName.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        downloadJSON(exportData, `${safeName}.json`);
    });
}
