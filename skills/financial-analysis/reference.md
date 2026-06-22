---
type: Reference
title: "Financial Analysis Reference"
description: "Reference material for the Financial Analysis skill."
resource: "https://github.com/dirtybits/agent-skills/blob/main/skills/financial-analysis/reference.md"
tags: ["finance", "analysis", "spreadsheets", "reference"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
---
# Financial Analysis Reference

## Common Financial Ratios

```python
def add_ratios(df):
    """Expects columns: revenue, gross_profit, ebitda, ebit, net_income, total_debt, equity, cash"""
    df["gross_margin"]   = df["gross_profit"] / df["revenue"]
    df["ebitda_margin"]  = df["ebitda"] / df["revenue"]
    df["ebit_margin"]    = df["ebit"] / df["revenue"]
    df["net_margin"]     = df["net_income"] / df["revenue"]
    df["leverage"]       = df["total_debt"] / df["ebitda"]
    df["net_leverage"]   = (df["total_debt"] - df["cash"]) / df["ebitda"]
    df["roe"]            = df["net_income"] / df["equity"]
    return df
```

## Year-over-Year Growth

```python
def yoy_growth(series):
    return series.pct_change()

# For a multi-column DataFrame
growth_cols = ["revenue", "ebitda", "fcf"]
for col in growth_cols:
    df[f"{col}_growth"] = df[col].pct_change()
```

## Rolling / TTM Calculations

```python
# Trailing twelve months on quarterly data
df["ttm_revenue"] = df["revenue"].rolling(4).sum()
df["ttm_ebitda"]  = df["ebitda"].rolling(4).sum()
```

## IRR Calculation

```python
import numpy_financial as npf

cash_flows = [-equity_check, 0, 0, 0, 0, exit_equity]
irr = npf.irr(cash_flows)
```

## Reading Excel Financial Models

```python
wb = openpyxl.load_workbook("model.xlsx", data_only=True)
ws = wb["Income Statement"]

# Extract a row by label
def find_row(ws, label, col=1):
    for row in ws.iter_rows():
        if row[col-1].value == label:
            return [cell.value for cell in row]
    return None

revenue_row = find_row(ws, "Total Revenue")
```

## Parsing 10-K / Financial Statement Text

```python
import re

def extract_dollar_amounts(text):
    """Finds dollar amounts like $1.2B, $500M, $1,234"""
    pattern = r'\$[\d,]+(?:\.\d+)?(?:\s?(?:billion|million|B|M|K))?'
    return re.findall(pattern, text, re.IGNORECASE)

def normalize_to_millions(value_str):
    v = value_str.replace("$", "").replace(",", "").strip()
    if "B" in v or "billion" in v.lower():
        return float(re.sub(r"[^\d.]", "", v)) * 1000
    elif "M" in v or "million" in v.lower():
        return float(re.sub(r"[^\d.]", "", v))
    else:
        return float(re.sub(r"[^\d.]", "", v)) / 1_000_000
```

## Scenario / Monte Carlo Analysis

```python
def run_scenarios(base_revenue, n=10_000):
    growth = np.random.normal(0.10, 0.03, n)
    margin = np.random.normal(0.25, 0.02, n)
    revenues = base_revenue * (1 + growth)
    ebitdas = revenues * margin
    return pd.DataFrame({"revenue": revenues, "ebitda": ebitdas})

results = run_scenarios(100_000_000)
print(results.describe(percentiles=[0.05, 0.25, 0.50, 0.75, 0.95]))
```

## Formatting Numbers for Display

```python
def fmt_millions(x):
    if abs(x) >= 1e9: return f"${x/1e9:.1f}B"
    if abs(x) >= 1e6: return f"${x/1e6:.1f}M"
    return f"${x:,.0f}"

def fmt_pct(x):
    return f"{x:.1%}"

def fmt_multiple(x):
    return f"{x:.1f}x"
```

## Common Pandas Gotchas in Finance

- `groupby` drops NaN keys by default — use `dropna=False` if needed
- `pct_change()` on sparse data produces inf — filter first
- Mixing int and float columns causes silent type coercions — use `df.astype(float)` on numeric columns
- `read_csv` with `thousands=","` won't work if values have `($1,234)` negative formatting — strip parens first:

```python
def clean_accounting_format(s):
    s = str(s).replace("(", "-").replace(")", "").replace(",", "").replace("$", "").strip()
    return pd.to_numeric(s, errors="coerce")
```
