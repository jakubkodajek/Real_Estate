import { getState, subscribe } from '../state';
import { calculateInvestment } from '../calculators/investmentCalc';
import { formatCurrency } from '../utils/formatters';

export function setupResultsTable(container: HTMLElement) {
    const render = () => {
        const state = getState();
        const projections = calculateInvestment(state);

        let rows = '';

        projections.forEach(p => {
            const cashflowClass = p.annualCashflow >= 0
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700';

            rows += `
                <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                    <td class="px-3 py-3 text-sm font-medium text-slate-900">${p.year}</td>
                    <td class="px-3 py-3 text-sm text-slate-600">${formatCurrency(p.propertyValue)}</td>
                    <td class="px-3 py-3 text-sm text-slate-600">${formatCurrency(p.monthlyRent)}</td>
                    <td class="px-3 py-3 text-sm text-slate-600">${formatCurrency(p.monthlyMortgagePayment)}</td>
                    <td class="px-3 py-3 text-sm text-slate-600">${formatCurrency(p.annualCostsWithoutMortgage)}</td>
                    <td class="px-3 py-3 text-sm text-slate-600 font-medium">${formatCurrency(p.averageMonthlyCosts)}</td>
                    <td class="px-3 py-3 text-sm text-blue-600 font-medium">${formatCurrency(p.annualRentalIncome)}</td>
                    <td class="px-3 py-3 text-sm text-orange-600 font-medium">${formatCurrency(p.annualTotalExpenses)}</td>
                    <td class="px-3 py-3 text-sm font-bold ${cashflowClass}">${formatCurrency(p.annualCashflow)}</td>
                    <td class="px-3 py-3 text-sm text-slate-600">${formatCurrency(p.annualPrincipalPaydown)}</td>
                    <td class="px-3 py-3 text-sm text-slate-600">${formatCurrency(p.annualAppreciation)}</td>
                    <td class="px-3 py-3 text-sm font-bold text-purple-600">${p.roi === Infinity ? '∞' : p.roi.toFixed(2)} %</td>
                </tr>
            `;
        });

        // Headers based on plan
        const tableHtml = `
            <table class="min-w-full divide-y divide-slate-200 text-left">
                <thead class="bg-slate-50 sticky top-0 z-10">
                    <tr>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rok</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Cena nem.</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nájem/měs</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Splátka/měs</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Náklady/rok (bez hypo)</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Prům. náklad/měs</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-blue-600 uppercase tracking-wider">Příjem/rok</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-orange-600 uppercase tracking-wider">Výdaje/rok</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-slate-800 uppercase tracking-wider">Cashflow/rok</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Umazaný dluh</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nárůst ceny</th>
                        <th scope="col" class="px-3 py-3 text-xs font-bold text-purple-600 uppercase tracking-wider">
                            <span class="roi-tooltip-trigger cursor-help border-b border-dashed border-purple-300">ROI (%)</span>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 bg-white">
                    ${rows}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHtml;
    };

    render();

    // Global tooltip handler
    const tooltipId = 'custom-roi-tooltip';

    // Remove old tooltip if exists to force recreate with new styles
    const oldTooltip = document.getElementById(tooltipId);
    if (oldTooltip) oldTooltip.remove();

    let tooltipEl = document.getElementById(tooltipId);

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = tooltipId;
        // Light theme: bg-white, text-slate-800, border-slate-200, shadow-2xl
        tooltipEl.className = 'fixed hidden z-[9999] opacity-0 transition-opacity duration-200 pointer-events-none p-4 bg-white text-slate-800 text-xs font-medium rounded-xl shadow-2xl border border-slate-200 w-auto min-w-[320px] max-w-md';
        tooltipEl.innerHTML = `
            <div class="font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Vzorec pro výpočet ROI</div>
            
            <div class="flex items-center justify-center gap-3 font-mono text-[11px] leading-tight text-slate-600">
                
                <!-- Fraction -->
                <div class="flex flex-col items-center">
                    <div class="border-b border-slate-300 pb-1 mb-1 text-center w-full px-2">
                        <span class="text-green-600 font-bold whitespace-nowrap">Cashflow</span> + 
                        <span class="text-blue-600 font-bold whitespace-nowrap">Umazaný dluh</span> + 
                        <span class="text-orange-500 font-bold whitespace-nowrap">Nárůst ceny</span>
                    </div>
                    <div class="text-slate-700 font-bold px-2">
                        Celková vstupní investice
                    </div>
                </div>

                <div class="text-lg text-slate-400 font-light">×</div>
                <div class="font-bold text-lg text-purple-600">100</div>
            </div>

            <div class="mt-3 pt-2 border-t border-slate-50 text-[10px] text-slate-400 italic text-center">
                Vstupní investice = Vlastní hotovost + Jednorázové poplatky
            </div>
        `;
        document.body.appendChild(tooltipEl);
    }

    const handleMouseEnter = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.roi-tooltip-trigger')) {
            const rect = target.getBoundingClientRect();
            if (tooltipEl) {
                tooltipEl.classList.remove('hidden');
                // Force reflow
                void tooltipEl.offsetWidth;
                tooltipEl.classList.remove('opacity-0');

                // Position above the element
                const tooltipHeight = tooltipEl.offsetHeight;
                const top = rect.top - tooltipHeight - 8;
                const left = rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2); // Center horizontally on trigger

                tooltipEl.style.top = `${top}px`;
                tooltipEl.style.left = `${left}px`; // Use calculated centered left
            }
        }
    };

    const handleMouseLeave = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.roi-tooltip-trigger')) {
            if (tooltipEl) {
                tooltipEl.classList.add('opacity-0');
                setTimeout(() => {
                    // Check if still hovered? No, simple logic for now.
                    // Actually better to wait for transition then hide.
                    if (tooltipEl && tooltipEl.classList.contains('opacity-0')) {
                        tooltipEl.classList.add('hidden');
                    }
                }, 200);
            }
        }
    };

    // Use event delegation on container
    container.addEventListener('mouseover', handleMouseEnter);
    container.addEventListener('mouseout', handleMouseLeave);

    subscribe(() => {
        render();
    });
}
