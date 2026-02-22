# 🏠 Realitní Kalkulátor — Projektový Plán

> Webová aplikace pro výpočet hypotéky a analýzu výnosnosti investice do nemovitosti.
> **Stack:** HTML · Tailwind CSS · TypeScript

---

## 📐 Architektura projektu

```
/
├── index.html                  # Hlavní HTML shell
├── src/
│   ├── main.ts                 # Entry point, inicializace
│   ├── types.ts                # Všechny TypeScript typy a interfacy
│   ├── state.ts                # Centrální state management (plain TS objekt)
│   │
│   ├── calculators/
│   │   ├── mortgageCalc.ts     # Logika hypoteční kalkulačky
│   │   └── investmentCalc.ts   # Logika kalkulačky výnosnosti
│   │
│   ├── components/
│   │   ├── MortgageForm.ts     # Formulář hypotéky (sekce 1)
│   │   ├── InvestmentForm.ts   # Formulář investice (sekce 2)
│   │   ├── ResultsTable.ts     # Tabulka vývoje v čase
│   │   ├── CashflowChart.ts    # Graf příjmů vs. výdajů
│   │   └── ExportButton.ts     # Export do JSON
│   │
│   └── utils/
│       ├── formatters.ts       # Formátování čísel, měny, %
│       └── exportJson.ts       # Serializace a stažení JSON
│
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🧩 Sekce 1 — Hypoteční kalkulačka

### Vstupní pole

| Pole | Typ | Popis |
|------|-----|-------|
| `loanAmount` | `number` | Výše úvěru v Kč |
| `rpsn` | `number` | RPSN v % |
| `ltv` | `number` | LTV v % (poměr úvěru k hodnotě nemovitosti) |
| `loanTerm` | `number` | Doba splácení v letech |

> ℹ️ `ltv` se použije ke zpětnému výpočtu hodnoty nemovitosti a propojení s kalkulačkou investice.

### Výstup

- **Měsíční splátka** — výpočet anuitní splátky
- **Roční splátka** — × 12
- **Celkem zaplaceno** — celková suma za celou dobu splácení
- **Přeplatek** — celkem zaplaceno minus jistina

### Vzorec (anuitní splátka)

```
M = P × [r(1+r)^n] / [(1+r)^n − 1]

kde:
  P = výše úvěru
  r = měsíční úroková sazba (RPSN / 12 / 100)
  n = počet měsíčních splátek (roky × 12)
```

---

## 🧩 Sekce 2 — Kalkulačka výnosnosti nemovitosti

### 2a. Vstupní parametry

#### 💰 Ceny
| Pole | Typ | Popis |
|------|-----|-------|
| `purchasePrice` | `number` | Kupní cena v Kč |
| `marketPrice` | `number` | Tržní (odhadní) cena v Kč |
| `monthlyRent` | `number` | Počáteční měsíční nájemné v Kč |

#### 🔧 Jednorázové náklady (při koupi)
| Pole | Typ | Popis |
|------|-----|-------|
| `agentCommission` | `number` | Provize realitní kanceláři v Kč |
| `acquisitionTax` | `number` | Daň z nabytí nemovitosti v Kč |
| `renovationCost` | `number` | Rekonstrukce před pronájmem v Kč |

#### 🔄 Roční provozní náklady
| Pole | Typ | Popis |
|------|-----|-------|
| `repairFund` | `number` | Fond oprav (Kč/měsíc) |
| `propertyInsurance` | `number` | Pojištění nemovitosti (Kč/rok) |
| `propertyTax` | `number` | Daň z nemovitosti (Kč/rok) |
| `otherCosts` | `number` | Ostatní náklady (Kč/rok) |
| `incomeTaxRate` | `number` | Daň z příjmu z nájmu v % |

#### 📈 Předpoklady trhu
| Pole | Typ | Popis |
|------|-----|-------|
| `propertyGrowthRate` | `number` | Roční růst ceny nemovitosti v % |
| `rentGrowthRate` | `number` | Roční růst nájemného v % |
| `inflationRate` | `number` | Inflace v % |
| `holdingPeriod` | `number` | Doba držení v letech |
| `occupancyRate` | `number` | Obsazenost v % (0–100) |

#### 🏦 Financování (propojeno se Sekcí 1)
| Pole | Typ | Popis |
|------|-----|-------|
| `ltv` | `number` | LTV v % — sdíleno se sekcí 1 |
| `rpsn` | `number` | RPSN v % — sdíleno se sekcí 1 |
| `loanTerm` | `number` | Doba splácení v letech |

> ✅ Pole `ltv`, `rpsn` a `loanTerm` jsou **synchronizována** mezi oběma kalkulačkami přes sdílený state.

---

### 2b. Tabulka vývoje v čase

Tabulka zobrazuje vývoj pro každý rok od 1 do `holdingPeriod`.

#### Sloupce tabulky

| Sloupec | Popis | Poznámka |
|---------|-------|----------|
| **Rok** | Číslo roku držení | 1, 2, 3 … |
| **Cena nemovitosti** | Aktualizovaná tržní cena | roste o `propertyGrowthRate` ročně |
| **Měsíční nájemné** | Aktuální nájemné | roste o `rentGrowthRate` ročně |
| **Měsíční splátka úvěru** | Konstantní anuitní splátka | z kalkulačky hypotéky |
| **Roční výdaje bez hypotéky** | Provozní náklady za rok | fond oprav + pojištění + daň + ostatní |
| **Průměrné měsíční náklady** | Celkové náklady / 12 | hypotéka + provozní |
| **Roční příjem z nájemného** | Nájemné × 12 × obsazenost | před zdaněním |
| **Roční výdaje celkem** | Splátky + provozní náklady | celkový roční odliv |
| **Roční cashflow** | Příjmy − výdaje | 🟢 kladné / 🔴 záporné |

#### Barevné kódování cashflow
- 🟢 **Zelená** — cashflow ≥ 0 (ziskové)
- 🔴 **Červená** — cashflow < 0 (ztrátové)
- Implementace: Tailwind třídy `bg-green-50 text-green-700` / `bg-red-50 text-red-700` aplikované dynamicky v TS

---

### 2c. Graf — příjmy vs. výdaje

#### Typ grafu
- Spojnicový graf (`<canvas>` + **Chart.js** nebo **lightweight-charts**)
- Dvě křivky přes celé období držení:
  - 🟦 **Roční příjem z nájemného** (modrá)
  - 🟧 **Roční výdaje celkem** (oranžová)
- Průsečík křivek = **bod zlomu cashflow** (vizuálně zvýrazněn svislou čárou a popiskem)

#### Interaktivita
- Tooltip při hover nad bodem (rok, hodnota příjmu, hodnota výdajů, cashflow)
- Legenda pod grafem
- Automatické přepočítání při změně jakéhokoliv vstupního parametru

---

## 💾 Export do JSON

### Struktura exportovaného souboru

```json
{
  "exportedAt": "2025-02-17T10:00:00.000Z",
  "mortgage": {
    "loanAmount": 3000000,
    "rpsn": 5.5,
    "ltv": 80,
    "loanTerm": 30,
    "monthlyPayment": 17028,
    "annualPayment": 204336,
    "totalPaid": 6130080,
    "overpayment": 3130080
  },
  "investment": {
    "inputs": {
      "purchasePrice": 4000000,
      "marketPrice": 4200000,
      "monthlyRent": 18000,
      "oneTimeCosts": { ... },
      "annualOperatingCosts": { ... },
      "marketAssumptions": { ... },
      "financing": { ... }
    },
    "yearlyProjections": [
      {
        "year": 1,
        "propertyValue": 4200000,
        "monthlyRent": 18000,
        "monthlyMortgagePayment": 17028,
        "annualCostsWithoutMortgage": 48000,
        "averageMonthlyCosts": 21028,
        "annualRentalIncome": 207360,
        "annualTotalExpenses": 252336,
        "annualCashflow": -44976
      }
    ]
  }
}
```

### Implementace exportu
```typescript
// src/utils/exportJson.ts
export function downloadJSON(data: object, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 🎨 UI/UX Design

### Layout
- **Single-page aplikace** s vertikálním scrollem
- Dvě hlavní sekce vedle sebe na wide screenu, stack na mobilu (Tailwind `lg:grid-cols-2`)
- Sticky navigační lišta s kotvami: `#hypoteka` · `#investice` · `#tabulka` · `#graf`

### Vizuální styl
- Čistý, profesionální — inspirace fintech dashboardy
- Barevná paleta: tmavě modrá primární (`#1E3A5F`), světlé šedé pozadí (`#F8FAFC`)
- Fonty: `DM Sans` (UI) + `JetBrains Mono` (čísla a kód)
- Zaoblené kartičky pro každou sekci (`rounded-2xl shadow-md`)
- Plynulé přepočítání — výsledky se updatují při každém `input` eventu (bez tlačítka Vypočítat)

### Responsivita
- Mobile-first přístup
- Breakpointy: `sm` (640px) · `md` (768px) · `lg` (1024px)
- Tabulka scrollovatelná horizontálně na mobilu (`overflow-x-auto`)

---

## 🛠️ Technické poznámky

### Závislosti
```json
{
  "dependencies": {
    "chart.js": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "vite": "^5.x"
  }
}
```

### Propojení kalkulaček (sdílený stav)
```typescript
// src/state.ts
interface AppState {
  ltv: number;
  rpsn: number;
  loanTerm: number;
  loanAmount: number;
  // ... ostatní pole
}

const state: AppState = { ... };

export function updateState(key: keyof AppState, value: number): void {
  state[key] = value;
  recalculateAll(); // přepočítá obě kalkulačky + tabulku + graf
}
```

### TypeScript typy
```typescript
// src/types.ts
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
}

export interface MortgageResult {
  monthlyPayment: number;
  annualPayment: number;
  totalPaid: number;
  overpayment: number;
}
```

---

## � Deployment (GitHub Pages)

Projekt je nastaven pro automatický deployment na GitHub Pages pomocí větve `gh-pages`.

### Požadavky
- V `vite.config.ts` je klíč `base` nastaven na název repozitáře (tj. `base: '/Real_Estate/'`).
- V `package.json` je nastaveno pole `"homepage"` na veřejnou URL adresu (tj. `https://jakubkodajek.github.io/Real_Estate/`).
- Nainstalován balíček `gh-pages` přes NPM.

### Jak nasadit novou verzi
Kdykoliv uděláš jakoukoliv změnu v kódu a chceš ji publikovat reálným uživatelům, stačí v terminálu spustit tento jeden příkaz:

```bash
npm run deploy
```

Tento script automaticky spustí produkční kompilaci (příkaz `npm run build`, který vytvoří složku `dist`) a následně její obsah odešle na GitHub. *Změny na ostrém webu se většinou projeví během 1–3 minut.*

---

## �📋 TODO / Možná rozšíření

- [x] Import uložené konfigurace z JSON
- [x] Zobrazení ROI a yield metriky (hrubý/čistý výnos)
- [ ] Porovnání více scénářů vedle sebe (optimistický / realistický / pesimistický)
- [ ] Export do CSV / Excel
- [ ] Kalkulace odpočtu úroků z hypotéky při dani z příjmu
- [ ] Dark mode přepínač
- [ ] Perzistence dat v `localStorage`

---

*Plán verze 1.0 — implementováno, projekt nasazen*