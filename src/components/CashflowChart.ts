import { getState, subscribe } from '../state';
import { calculateInvestment } from '../calculators/investmentCalc';
import Chart from 'chart.js/auto';

export function setupCashflowChart(canvas: HTMLCanvasElement) {
    let chart: Chart | null = null;

    const render = () => {
        const state = getState();
        const projections = calculateInvestment(state);

        const labels = projections.map(p => `Rok ${p.year}`);
        const incomeData = projections.map(p => p.annualRentalIncome);
        const expenseData = projections.map(p => p.annualTotalExpenses);

        if (chart) {
            chart.data.labels = labels;
            chart.data.datasets[0].data = incomeData;
            chart.data.datasets[1].data = expenseData;
            chart.update();
        } else {
            chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Roční příjem z nájmu',
                            data: incomeData,
                            borderColor: '#2563EB', // Blue 600
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Roční výdaje celkem',
                            data: expenseData,
                            borderColor: '#EA580C', // Orange 600
                            backgroundColor: 'rgba(234, 88, 12, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: false, // Disable default canvas legend
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(context.parsed.y);
                                    }
                                    return label;
                                },
                                afterBody: function (tooltipItems) {
                                    const income = tooltipItems[0].parsed.y || 0;
                                    const expense = tooltipItems[1].parsed.y || 0;
                                    const cashflow = income - expense;
                                    return `Cashflow: ${new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(cashflow)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return new Intl.NumberFormat('cs-CZ', { compactDisplay: 'short', notation: 'compact' }).format(value as number);
                                }
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'htmlLegend',
                    afterUpdate(chart) {
                        const container = document.getElementById('custom-legend');
                        if (!container) return;

                        // Clear previous
                        container.innerHTML = '';

                        // If no default generator, fallback to simple mapping
                        const datasets = chart.data.datasets;

                        datasets.forEach((dataset) => {
                            const item = document.createElement('div');
                            item.className = 'flex items-center gap-2';

                            const box = document.createElement('span');
                            box.className = 'w-3 h-3 rounded-full inline-block border';
                            box.style.backgroundColor = dataset.backgroundColor as string;
                            box.style.borderColor = dataset.borderColor as string;
                            box.style.borderWidth = '2px';

                            const text = document.createElement('span');
                            text.className = 'font-medium text-slate-700';
                            text.innerText = dataset.label || '';

                            item.appendChild(box);
                            item.appendChild(text);
                            container.appendChild(item);
                        });
                    }
                }]
            });
        }
    };

    render();

    subscribe(() => {
        render();
    });
}
