export interface MortgageParams {
    loanAmount: number;
    rpsn: number;
    ltv: number;
    loanTerm: number;
}

export interface MortgageResult {
    monthlyPayment: number;
    annualPayment: number;
    totalPaid: number;
    overpayment: number;
}

export interface InvestmentParams {
    // Prices
    purchasePrice: number;
    marketPrice: number;
    monthlyRent: number;

    // One-time costs
    agentCommission: number;
    acquisitionTax: number;
    renovationCost: number;

    // Operating costs
    repairFund: number;
    propertyInsurance: number;
    propertyTax: number;
    otherCosts: number;
    incomeTaxRate: number;

    // Market assumptions
    propertyGrowthRate: number;
    rentGrowthRate: number;
    inflationRate: number;
    holdingPeriod: number;
    occupancyRate: number;

    // Financing (linked to MortgageParams)
    ltv: number;
    rpsn: number;
    loanTerm: number;
}

export interface YearlyProjection {
    year: number;
    propertyValue: number;
    monthlyRent: number;
    monthlyMortgagePayment: number;
    annualCostsWithoutMortgage: number;
    averageMonthlyCosts: number;
    annualRentalIncome: number;
    annualTotalExpenses: number;
    annualCashflow: number;
    annualAppreciation: number;
    annualPrincipalPaydown: number;
    roi: number;
}

export interface AppState extends MortgageParams, Omit<InvestmentParams, 'ltv' | 'rpsn' | 'loanTerm'> {
    projectName: string;
}

export type StateKey = keyof AppState;
