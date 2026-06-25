---
type: Skill
name: financial-analysis
title: "Financial Analysis"
description: Guides and best practices for working with financial documents, building financial models, wrangling CSV data, and structuring Jupyter notebooks. Use when the user is building DCF models, LBO models, comparable analysis, analyzing financial data in CSVs, creating charts/visualizations of financial data, or structuring Jupyter notebooks for financial analysis.
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/financial-analysis"
tags: ["finance", "analysis", "spreadsheets"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
license: MIT
---

# Financial Analysis

## Core Stack

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import openpyxl
```

---

## CSV / Data Wrangling

### Loading financial CSVs
```python
df = pd.read_csv("data.csv", thousands=",", parse_dates=["Date"])
df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
```

### Common cleaning steps
```python
df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce")
df = df.dropna(subset=["revenue"])
df = df.sort_values("date").reset_index(drop=True)
```

### Period aggregations
```python
df["year"] = df["date"].dt.year
annual = df.groupby("year").agg({"revenue": "sum", "ebitda": "sum"})
annual["margin"] = annual["ebitda"] / annual["revenue"]
```

---

## Financial Modeling Patterns

### DCF skeleton
```python
# Inputs
revenue_base = 100_000_000
growth_rates = [0.15, 0.12, 0.10, 0.08, 0.06]
ebitda_margin = 0.25
da_pct = 0.04
capex_pct = 0.05
nwc_pct = 0.03  # projected NWC as % of revenue; FCF uses the CHANGE in NWC
tax_rate = 0.25
wacc = 0.10
terminal_growth = 0.025
net_debt = 20_000_000
shares_out = 10_000_000

# Projections
revenues = [revenue_base * np.prod([1 + g for g in growth_rates[: i + 1]]) for i in range(5)]
ebitda = [r * ebitda_margin for r in revenues]
da = [r * da_pct for r in revenues]
ebit = [e - d for e, d in zip(ebitda, da)]
nopat = [x * (1 - tax_rate) for x in ebit]
capex = [r * capex_pct for r in revenues]
nwc = [r * nwc_pct for r in revenues]
change_nwc = [nwc[0] - revenue_base * nwc_pct] + [nwc[i] - nwc[i - 1] for i in range(1, len(nwc))]
fcf = [n + d - c - dnwc for n, d, c, dnwc in zip(nopat, da, capex, change_nwc)]

# Terminal value sanity: terminal_growth must be below WACC.
assert terminal_growth < wacc, "terminal growth must be below WACC"
terminal_value = fcf[-1] * (1 + terminal_growth) / (wacc - terminal_growth)
discount_factors = [(1 / (1 + wacc)) ** (i + 1) for i in range(5)]
enterprise_value = sum(f * d for f, d in zip(fcf, discount_factors)) + terminal_value * discount_factors[-1]
equity_value = enterprise_value - net_debt
implied_share_price = equity_value / shares_out
```

### Sensitivity table (2-variable)
```python
waccs = np.arange(0.08, 0.13, 0.01)
tgrs = np.arange(0.015, 0.04, 0.005)
sensitivity = pd.DataFrame(
    index=[f"{w:.0%}" for w in waccs],
    columns=[f"{g:.1%}" for g in tgrs],
    data=[[fcf[-1] * (1 + g) / (w - g) * (1/(1+w))**5 for g in tgrs] for w in waccs]
)
```

### LBO returns
```python
def moic(entry_ev, exit_ev, entry_debt, exit_debt, equity_check):
    # equity_check is the sponsor cash invested at entry, after fees/rollover if applicable.
    if equity_check <= 0:
        raise ValueError("equity_check must be positive")
    exit_equity = exit_ev - exit_debt
    return exit_equity / equity_check

def irr_approx(moic_val, years):
    return moic_val ** (1 / years) - 1
```

### Comps table
```python
comps = pd.DataFrame({
    "company": ["A", "B", "C"],
    "ev": [500, 800, 1200],
    "ebitda": [50, 75, 110],
    "revenue": [200, 350, 500],
})
comps["ev_ebitda"] = comps["ev"] / comps["ebitda"]
comps["ev_revenue"] = comps["ev"] / comps["revenue"]
print(comps[["company","ev_ebitda","ev_revenue"]].describe().loc[["mean","median"]])
```

## Production Modeling Guardrails

Before trusting outputs, check units/currency, fiscal periods, restatements, negative values shown in accounting parentheses, source timestamps, and whether line items are point-in-time balance sheet values or period flow values. For ratios and growth rates, guard against zero or negative denominators and explain when a metric is not meaningful. Validate every DCF/LBO with at least one sensitivity table and a bridge from enterprise value to equity value.

---

## Visualizations

### Consistent financial chart style
```python
def set_fin_style(ax, title, ylabel="$M"):
    ax.set_title(title, fontweight="bold", pad=10)
    ax.set_ylabel(ylabel)
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"${x/1e6:.0f}M"))
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", linestyle="--", alpha=0.5)
```

### Waterfall chart (bridge)
```python
def waterfall(labels, values, title="Bridge"):
    running = 0
    bottoms, colors = [], []
    for v in values:
        bottoms.append(running if v >= 0 else running + v)
        colors.append("#2ecc71" if v >= 0 else "#e74c3c")
        running += v
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(labels, [abs(v) for v in values], bottom=bottoms, color=colors, width=0.6)
    set_fin_style(ax, title)
    return fig, ax
```

### Multi-metric time series
```python
fig, axes = plt.subplots(2, 2, figsize=(12, 8))
fig.suptitle("Financial Summary", fontweight="bold")
metrics = [("revenue", "Revenue"), ("ebitda", "EBITDA"),
           ("margin", "Margin", "%"), ("fcf", "FCF")]
for ax, (col, label, *fmt) in zip(axes.flat, metrics):
    annual[col].plot(ax=ax)
    set_fin_style(ax, label, ylabel=fmt[0] if fmt else "$M")
plt.tight_layout()
```

---

## Jupyter Notebook Structure

### Standard notebook layout for financial analysis
```
1. Setup & Imports
2. Data Loading & Validation
3. Cleaning & Normalization
4. Model / Analysis
5. Outputs & Visualizations
6. Sensitivity / Scenarios
7. Export
```

### Cell discipline
- One logical operation per cell
- Use `# ---` headers as section dividers
- Store intermediate results in clearly named variables (`revenue_df`, `dcf_inputs`, `sensitivity_table`)
- Use `display(df.head())` not `print()` for DataFrames

### Reproducibility
```python
# Top of every notebook
import warnings; warnings.filterwarnings("ignore")
pd.set_option("display.float_format", "{:,.2f}".format)
np.random.seed(42)
VINTAGE = "2026-02-20"  # update per run
```

### Exporting outputs
```python
# Excel with multiple sheets
with pd.ExcelWriter("output/model_output.xlsx", engine="openpyxl") as writer:
    revenue_df.to_excel(writer, sheet_name="Revenue", index=False)
    dcf_df.to_excel(writer, sheet_name="DCF")
    sensitivity.to_excel(writer, sheet_name="Sensitivity")

# Save all figures
for name, fig in figures.items():
    fig.savefig(f"output/{name}.png", dpi=150, bbox_inches="tight")
```

---

## Conventions

- Dollar amounts: store in raw dollars, display in $M or $B via formatters
- Percentages: store as decimals (0.25 = 25%), format with `:.1%`
- Negative values: use sign convention consistently (costs negative or costs positive with explicit label)
- Column names: `snake_case`, no spaces or special chars
- File naming: `YYYY-MM-DD_model-name.xlsx`

## Additional Resources

- For extended modeling patterns and formula reference, see [reference.md](reference.md)

## Scope ladder for expensive analysis

Start financial analysis with the smallest artifact that can answer the decision: summary page, latest quarter, key assumptions tab, or one exported table. Only expand to full workbooks or multi-year models after identifying the exact metric or driver that matters. Report assumptions and confidence before producing large outputs; this keeps agent runs cheaper and makes errors easier to audit.
