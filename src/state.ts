import type { AppState, StateKey } from './types';

export const defaultState: AppState = {
    projectName: 'Můj Projekt',
    // Mortgage Defaults
    loanAmount: 3200000,
    rpsn: 5.5,
    ltv: 80,
    loanTerm: 30,

    // Investment Defaults
    purchasePrice: 4000000,
    marketPrice: 4000000,
    monthlyRent: 18000,

    // One-time
    agentCommission: 0,
    acquisitionTax: 0,
    renovationCost: 0,

    // Operating
    repairFund: 2000,
    propertyInsurance: 3000,
    propertyTax: 1000,
    otherCosts: 0,
    incomeTaxRate: 15,

    // Market
    propertyGrowthRate: 5,
    rentGrowthRate: 3,
    inflationRate: 2,
    holdingPeriod: 10,
    occupancyRate: 95,
};

// Simple Observer Pattern
type Listener = (state: AppState) => void;
const listeners: Set<Listener> = new Set();

let currentState: AppState = { ...defaultState };

export const getState = (): AppState => ({ ...currentState });

const notifyListeners = () => {
    listeners.forEach(listener => listener(currentState));
};

export const setState = (key: StateKey, value: number | string) => {
    // @ts-ignore - simple runtime assignment, type safety is good enough for now or we refine AppState
    currentState = { ...currentState, [key]: value };
    notifyListeners();
};

export const subscribe = (listener: Listener) => {
    listeners.add(listener);
    // Call immediately with current state
    listener(currentState);
    return () => listeners.delete(listener);
};
