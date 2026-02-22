import type { AppState, YearlyProjection } from '../types';
import { calculateMortgage } from './mortgageCalc';

export function calculateInvestment(state: AppState): YearlyProjection[] {
    const {
        marketPrice: initialMarketPriceRaw,
        monthlyRent: initialMonthlyRentRaw,
        repairFund: repairFundRaw,
        propertyInsurance: propertyInsuranceRaw,
        propertyTax: propertyTaxRaw,
        otherCosts: otherCostsRaw,
        propertyGrowthRate,
        rentGrowthRate,
        holdingPeriod: holdingPeriodRaw,
        occupancyRate: occupancyRateRaw,
        loanAmount: loanAmountRaw,
        rpsn: rpsnRaw,
        loanTerm: loanTermRaw,
        ltv: ltvRaw
    } = state;

    // Bezpečnostní limity (Security Clamping)
    const initialMarketPrice = Math.max(0, initialMarketPriceRaw);
    const initialMonthlyRent = Math.max(0, initialMonthlyRentRaw);
    const repairFund = Math.max(0, repairFundRaw);
    const propertyInsurance = Math.max(0, propertyInsuranceRaw);
    const propertyTax = Math.max(0, propertyTaxRaw);
    const otherCosts = Math.max(0, otherCostsRaw);
    // Limit for execution DOS: Max 100 let (prohlížeč bezpečně zvládá do srážek tisíců iterací, ale 100 je logické maximum realit)
    const holdingPeriod = Math.max(1, Math.min(holdingPeriodRaw, 100));
    const occupancyRate = Math.max(0, Math.min(occupancyRateRaw, 100));
    const loanAmount = Math.max(0, loanAmountRaw);
    const rpsn = Math.max(0, rpsnRaw);
    const loanTerm = Math.max(0, Math.min(loanTermRaw, 100));
    const ltv = Math.max(0, ltvRaw);

    // Calculate mortgage payment once (fixed)
    const mortgageResult = calculateMortgage({
        loanAmount,
        rpsn,
        ltv,
        loanTerm
    });

    const yearlyMortgagePayment = mortgageResult.annualPayment;
    const monthlyMortgagePayment = mortgageResult.monthlyPayment;
    const monthlyRate = (rpsn / 100) / 12;

    const projections: YearlyProjection[] = [];

    let currentPropertyValue = initialMarketPrice; // Start with market value
    let currentMonthlyRent = initialMonthlyRent;

    // Operating costs variables
    const annualRepairFund = repairFund * 12;
    let currentAnnualOperatingCosts = annualRepairFund + propertyInsurance + propertyTax + otherCosts;
    const inflationMultiplier = 1 + (state.inflationRate / 100);

    // Initial Investment Basis
    const initialOwnCash = state.purchasePrice - loanAmount;
    const totalInitialInvestment = initialOwnCash + state.agentCommission + state.acquisitionTax + state.renovationCost;

    // Mortgage Balance tracking
    let currentLoanBalance = loanAmount;

    for (let year = 1; year <= holdingPeriod; year++) {
        const previousPropertyValue = currentPropertyValue;

        // 1. Property Value Growth
        currentPropertyValue = currentPropertyValue * (1 + propertyGrowthRate / 100);
        const annualAppreciation = currentPropertyValue - previousPropertyValue;

        // 2. Rent Growth
        // Year 1 rent = Initial. Year 2 = Year 1 * (1 + growth).
        if (year > 1) {
            currentMonthlyRent = currentMonthlyRent * (1 + rentGrowthRate / 100);
            // Costs inflate
            currentAnnualOperatingCosts = currentAnnualOperatingCosts * inflationMultiplier;
        }

        // 3. Mortgage Balance & Principal Paydown
        // Calculate balance at end of year
        let yearStartBalance = currentLoanBalance;
        let yearEndBalance = currentLoanBalance;
        // Simulate 12 monthly payments
        for (let m = 0; m < 12; m++) {
            if (yearEndBalance > 0) {
                const interest = yearEndBalance * monthlyRate;
                const principal = monthlyMortgagePayment - interest;
                yearEndBalance -= principal;
                if (yearEndBalance < 0) yearEndBalance = 0;
            }
        }
        const annualPrincipalPaydown = yearStartBalance - yearEndBalance;
        currentLoanBalance = yearEndBalance;

        // Calculate Annual Income
        // Rent * 12 * Occupancy
        const annualRentalIncome = currentMonthlyRent * 12 * (occupancyRate / 100);

        // Total Expenses
        const annualTotalExpenses = yearlyMortgagePayment + currentAnnualOperatingCosts;

        // Cashflow
        // Income - Expenses
        // Note: Tax on income (incomeTaxRate) is mentioned in inputs but not explicitly in "Roční výdaje celkem" column description in Plan.
        // Plan says: "Roční výdaje celkem = Splátky + provozní náklady".
        // It doesn't mention Income Tax in the expenses column def.
        // However, "Income Calculation" is "Nájemné x 12 x obsazenost (před zdaněním)".
        // If we want "Cashflow", we should subtract tax.
        // But Plan 2b table col "Roční výdaje celkem" definition is "Splátky + provozní".
        // And "Roční cashflow" = "Příjmy - výdaje".
        // This implies Pre-Tax Cashflow.
        // I will stick to the plan's definition of columns.
        const annualCashflow = annualRentalIncome - annualTotalExpenses;

        // ROI Calculation (Total Return)
        // User requested to include property appreciation ("nárust ceny nemovitosti") in ROI.
        // Total Return = Cashflow + Appreciation + Principal Paydown (Equity Buildup)

        const totalAnnualReturn = annualCashflow + annualAppreciation + annualPrincipalPaydown;

        let roi = 0;
        if (totalInitialInvestment > 0) {
            roi = (totalAnnualReturn / totalInitialInvestment) * 100;
        } else if (totalInitialInvestment === 0 && totalAnnualReturn > 0) {
            roi = Infinity; // Infinite return if no money down
        }

        projections.push({
            year,
            propertyValue: currentPropertyValue,
            monthlyRent: currentMonthlyRent,
            monthlyMortgagePayment,
            annualCostsWithoutMortgage: currentAnnualOperatingCosts,
            averageMonthlyCosts: annualTotalExpenses / 12, // Average monthly
            annualRentalIncome,
            annualTotalExpenses,
            annualCashflow,
            annualAppreciation,
            annualPrincipalPaydown,
            roi
        });
    }

    return projections;
}
