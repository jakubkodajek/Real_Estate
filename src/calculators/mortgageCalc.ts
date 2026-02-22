import type { MortgageParams, MortgageResult } from '../types';

export function calculateMortgage(params: MortgageParams): MortgageResult {
    // Clamping / Ochranné limity
    const loanAmount = Math.max(0, params.loanAmount);
    const rpsn = Math.max(0, Math.min(params.rpsn, 100)); // Úrok max 100%
    const loanTerm = Math.max(0, Math.min(params.loanTerm, 35)); // Limit splácení na max 35 let

    if (loanAmount <= 0 || loanTerm <= 0) {
        return {
            monthlyPayment: 0,
            annualPayment: 0,
            totalPaid: 0,
            overpayment: 0
        };
    }

    const r = (rpsn / 100) / 12; // Monthly interest rate
    const n = loanTerm * 12;     // Total number of payments

    let monthlyPayment = 0;

    if (r === 0) {
        monthlyPayment = loanAmount / n;
    } else {
        // M = P * [r(1+r)^n] / [(1+r)^n - 1]
        monthlyPayment = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const annualPayment = monthlyPayment * 12;
    const totalPaid = monthlyPayment * n;
    const overpayment = totalPaid - loanAmount;

    return {
        monthlyPayment,
        annualPayment,
        totalPaid,
        overpayment
    };
}
