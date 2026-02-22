import './style.css';
import { setupMortgageForm } from './components/MortgageForm';
import { setupInvestmentForm } from './components/InvestmentForm';
import { setupResultsTable } from './components/ResultsTable';
import { setupCashflowChart } from './components/CashflowChart';
import { setupExportButton } from './components/ExportButton';
import { setupImportButton } from './components/ImportButton';
import { setupExpandableSection } from './utils/uiHelpers';
import { getState, setState, subscribe } from './state'; // Import state utils for project name binding

document.addEventListener('DOMContentLoaded', () => {
  // 0. Project Name
  const projectNameInput = document.getElementById('project-name') as HTMLInputElement;
  if (projectNameInput) {
    // Init value
    projectNameInput.value = getState().projectName;

    // Listen for changes
    projectNameInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      setState('projectName', target.value);
    });

    // Subscribe to external updates (e.g. from Import)
    subscribe((state) => {
      if (projectNameInput.value !== state.projectName) {
        projectNameInput.value = state.projectName;
      }
    });
  }

  // 1. Mortgage Form
  const mortgageFormContainer = document.getElementById('mortgage-form');
  const mortgageResultContainer = document.getElementById('mortgage-result');
  if (mortgageFormContainer && mortgageResultContainer) {
    setupMortgageForm(mortgageFormContainer, mortgageResultContainer);
  }

  // 2. Investment Form
  const investmentFormContainer = document.getElementById('investment-form');
  if (investmentFormContainer) {
    setupInvestmentForm(investmentFormContainer);
  }

  // 3. Results Table
  const resultsTableContainer = document.getElementById('results-table-container');
  if (resultsTableContainer) {
    setupResultsTable(resultsTableContainer);
  }

  // 4. Chart
  const chartCanvas = document.getElementById('cashflow-chart') as HTMLCanvasElement;
  if (chartCanvas) {
    setupCashflowChart(chartCanvas);
  }

  // 5. Export Button
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
  if (exportBtn) {
    setupExportButton(exportBtn);
  }

  // 6. Import Button
  const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
  const importInput = document.getElementById('import-file') as HTMLInputElement;
  if (importBtn && importInput) {
    setupImportButton(importBtn, importInput);
  }

  // 7. Expandable Sections
  setupExpandableSection('tabulka', 'expand-table-btn',
    // Table Expand
    () => {
      const container = document.getElementById('table-scroll-container');
      if (container) {
        container.classList.remove('max-h-[600px]');
        container.classList.add('h-full');
      }
    },
    // Table Collapse
    () => {
      const container = document.getElementById('table-scroll-container');
      if (container) {
        container.classList.add('max-h-[600px]');
        container.classList.remove('h-full');
      }
    }
  );

  setupExpandableSection('graf', 'expand-chart-btn',
    // Chart Expand
    () => {
      const container = document.getElementById('chart-container');
      if (container) {
        container.classList.remove('h-[200px]');
        container.classList.add('h-full', 'flex-grow');
      }
      window.dispatchEvent(new Event('resize'));
    },
    // Chart Collapse
    () => {
      const container = document.getElementById('chart-container');
      if (container) {
        container.classList.add('h-[200px]');
        container.classList.remove('h-full', 'flex-grow');
      }
      window.dispatchEvent(new Event('resize'));
    }
  );
});
