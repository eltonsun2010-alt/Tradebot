# EMA + RSI + ATR Trading Bot

A modular, production-oriented algorithmic trading bot built around three
classic technical indicators — an **EMA trend filter**, **RSI momentum** and
**ATR volatility** — wrapped in strict risk management, a realistic backtester,
walk-forward optimization, paper trading and a live-trading scaffold.

Everything is configurable, documented, type-hinted and covered by an automated
test suite.

---

## Table of contents

1. [Features](#features)
2. [Project architecture](#project-architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the bot](#running-the-bot)
6. [Backtesting](#backtesting)
7. [Paper trading](#paper-trading)
8. [Live trading](#live-trading)
9. [Optimization](#optimization)
10. [Running the tests](#running-the-tests)
11. [The strategy in detail](#the-strategy-in-detail)
12. [Performance report](#performance-report)
13. [Troubleshooting](#troubleshooting)

---

## Features

- **Indicators** — vectorised EMA, RSI (Wilder), ATR (Wilder) and True Range,
  implemented from scratch with pandas/numpy.
- **Strategy** — EMA trend filter + RSI momentum cross + close-vs-EMA
  confirmation + ATR volatility filter. ATR-based stop loss, take profit,
  trailing stop and move-to-breakeven.
- **Risk management** — fixed-fractional position sizing (1% risk per trade by
  default), leverage cap, maximum daily loss, maximum consecutive losses and a
  trading pause to prevent revenge trading.
- **Trade filters** — low-volatility, wide-spread, thin-volume and (optional)
  weekend filters.
- **Backtester** — event-driven engine with realistic commission, slippage and
  spread; produces an equity curve, a full trade log and a rich performance
  report.
- **Charts** — equity curve, drawdown, price with trade markers, monthly
  returns.
- **Optimization** — grid search and **walk-forward** optimization to guard
  against overfitting.
- **Paper trading** — a simulated broker with the same interface as the live
  broker so strategies are validated risk-free first.
- **Live trading** — a `ccxt`-based broker with reconnect/backoff, rate
  limiting, order confirmation and position synchronisation. API keys are read
  from environment variables and never logged.
- **Logging** — every entry, exit, error and warning is timestamped and written
  to a rotating log file.

---

## Project architecture

```
trading-bot/
├── config.py               # All tunable parameters (dataclasses). No hardcoded values.
├── main.py                 # CLI entry point (backtest / paper / optimize / validate / live)
├── bot_logging.py          # Central logging setup
├── trading_engine.py       # Real-time engine shared by paper and live modes
├── requirements.txt
├── conftest.py             # Makes the flat module layout importable by pytest
│
├── indicators/
│   └── core.py             # ema, rsi, atr, true_range, add_indicators
├── strategy/
│   ├── signals.py          # Entry signals, stops, trailing/breakeven, exit checks
│   └── filters.py          # Trade filters (ATR/spread/volume/weekend)
├── risk/
│   └── manager.py          # Position sizing + circuit breakers
├── exchange/
│   ├── base.py             # Order/Position/Trade types + Broker interface
│   ├── paper.py            # PaperBroker (simulated fills)
│   └── live.py             # CCXTBroker (Binance etc.) — optional ccxt dependency
├── backtesting/
│   ├── engine.py           # Event-driven backtester
│   ├── metrics.py          # Performance metrics
│   └── plots.py            # Charting
├── optimization/
│   └── optimizer.py        # Grid search + walk-forward
├── data/
│   └── loader.py           # CSV load/save + realistic synthetic data generator
├── logs/                   # Log files and generated charts (git-ignored)
└── tests/                  # Automated test suite (pytest)
```

The data flow is identical across backtest, paper and live modes:

```
candles → add_indicators → add_filter_columns → add_signal_columns
        → apply_filters → generate_signal → RiskManager.position_size
        → Broker.open_position → (per candle) check_exit / trailing stop
        → Broker.close_position → metrics/report
```

---

## Installation

Requires **Python 3.10+**.

```bash
cd trading-bot
python -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

`ccxt` is only needed for live trading and is left commented out in
`requirements.txt`. Install it when you are ready to go live:

```bash
pip install ccxt
```

---

## Configuration

Every parameter lives in [`config.py`](config.py) as a set of dataclasses:

| Config              | Controls                                                        |
| ------------------- | -------------------------------------------------------------- |
| `IndicatorConfig`   | EMA/RSI/ATR periods, ATR-average window                        |
| `StrategyConfig`    | RSI thresholds, ATR stop/TP/trail multipliers, breakeven, cross lookback |
| `RiskConfig`        | Risk per trade, leverage cap, daily-loss and loss-streak limits |
| `FilterConfig`      | ATR floor, spread ceiling, volume floor, weekend toggle        |
| `CostConfig`        | Commission, slippage, spread                                   |
| `ExchangeConfig`    | Exchange name, symbol, timeframe, testnet flag (secrets via env) |
| `BacktestConfig`    | Initial balance, periods-per-year, risk-free rate              |
| `OptimizationConfig`| Walk-forward window sizes, objective, parameter grids          |
| `LoggingConfig`     | Log level, directory, file, console toggle                     |

Nothing is hardcoded elsewhere — change a value here and it propagates
everywhere. `Config` is a plain dataclass, so you can copy-and-mutate it safely
(the optimizer does exactly this):

```python
from dataclasses import replace
from config import get_config

cfg = get_config()
cfg = replace(cfg, risk=replace(cfg.risk, risk_per_trade=0.005))  # risk 0.5%
```

### Secrets

API credentials are **never** stored in `config.py`. Set them in the
environment:

```bash
export EXCHANGE_API_KEY="your_key"
export EXCHANGE_API_SECRET="your_secret"
```

---

## Running the bot

The CLI is `main.py`. Run `python main.py <command> --help` for options.

```bash
python main.py backtest   # single backtest + report (+ optional charts/JSON)
python main.py paper      # paper trading over a candle feed
python main.py optimize   # walk-forward optimization
python main.py validate   # backtest across all market regimes
python main.py live        # live trading scaffold (requires ccxt + credentials)
```

Common data options (for every command except `live`):

| Flag          | Default | Meaning                                          |
| ------------- | ------- | ------------------------------------------------ |
| `--csv PATH`  | –       | Use an OHLCV CSV instead of synthetic data       |
| `--periods N` | 8000    | Number of synthetic candles                      |
| `--regime R`  | bull    | `bull` / `bear` / `sideways` / `high_vol` / `low_vol` |
| `--timeframe` | 1h      | Candle frequency for synthetic data              |
| `--seed N`    | 42      | RNG seed for reproducibility                     |

### CSV format

A CSV must have a `timestamp` column plus `open, high, low, close, volume`:

```csv
timestamp,open,high,low,close,volume
2022-01-01T00:00:00Z,20000,20120,19950,20080,120.5
...
```

---

## Backtesting

```bash
python main.py backtest --regime bull --charts logs/charts --json logs/report.json
```

- Prints a full performance report to the console.
- `--charts DIR` writes `equity_curve.png`, `drawdown.png`, `trades.png` and
  `monthly_returns.png`.
- `--json PATH` writes the report as JSON.

The backtester models realistic frictions (`CostConfig`): commission and
slippage/spread are applied to every fill, and when both the stop and target
fall inside one candle the **stop is assumed to trigger first** (a conservative
worst-case).

---

## Paper trading

Paper trading streams candles one at a time through the exact same
`TradingEngine` used for live trading, against a simulated `PaperBroker`:

```bash
python main.py paper --regime sideways
```

The paper broker tracks balance, the open position, realised/unrealised P&L,
fees, slippage and a full trade history — with **zero** capital at risk. Because
the engine is broker-agnostic, behaviour is identical to live trading apart from
where fills happen.

---

## Live trading

> ⚠️ **Live trading risks real money. Test thoroughly on paper and testnet
> first.**

1. `pip install ccxt`
2. Export `EXCHANGE_API_KEY` / `EXCHANGE_API_SECRET`.
3. Set `ExchangeConfig.testnet = True` in `config.py` until you are confident.
4. Run:

```bash
python main.py live --i-understand-the-risk
```

The [`CCXTBroker`](exchange/live.py) provides:

- **Reconnect logic** with exponential backoff on transient errors.
- **Rate limiting** (ccxt-managed).
- **Order confirmation** — fill price and commission are read back from the
  order response.
- **Position synchronisation / recovery** — `synchronise()` reconciles the local
  position with the exchange on startup so the bot recovers after a restart.
- **Security** — credentials come only from the environment and are never
  logged.

The `live` command wires these pieces together and refuses to start without
credentials and the explicit `--i-understand-the-risk` flag. Connect it to a
candle-close scheduler (e.g. a cron/`asyncio` loop calling
`engine.on_candles(...)` on each closed candle) to run continuously.

---

## Optimization

Walk-forward optimization chooses parameters on an in-sample window and
evaluates them on the **following** out-of-sample window, which never influenced
the choice. Aggregating the out-of-sample windows gives an honest, overfitting-
resistant performance estimate.

```bash
python main.py optimize --regime bull
```

The search space (EMA lengths, RSI period, RSI thresholds, ATR stop/TP) is
defined by `OptimizationConfig`. Nonsensical combinations (e.g. `ema_fast >=
ema_slow`) are skipped, and parameter sets with too few trades are penalised so
the optimizer does not chase statistical noise.

Programmatic use:

```python
from optimization.optimizer import walk_forward, grid_search
from config import get_config
from data.loader import generate_synthetic_ohlcv

cfg = get_config()
candles = generate_synthetic_ohlcv(6000, regime="bull")
result = walk_forward(cfg, candles)
print(result.summary())
```

---

## Running the tests

```bash
cd trading-bot
python -m pytest -q
```

The suite (78 tests) covers indicators, entry/exit logic, position sizing, the
risk circuit breakers, trade execution/accounting, the backtester and metrics,
configuration loading, filters, the data loader, the optimizer, the real-time
engine and the CLI.

---

## The strategy in detail

### Long entry — **all** must hold

1. `EMA14 > EMA50` — up-trend.
2. RSI crossed **above** the oversold level (30) — momentum turning up.
3. Candle closes **above** EMA14 — price back in trend.
4. `ATR > recent ATR average` — enough volatility.

### Short entry — **all** must hold

1. `EMA14 < EMA50` — down-trend.
2. RSI crossed **below** the overbought level (70).
3. Candle closes **below** EMA14.
4. `ATR > recent ATR average`.

### Exits

- **Stop loss** at `1.5 × ATR` from entry.
- **Take profit** at `3 × ATR` from entry (2:1 reward:risk).
- **Trailing stop** at `1.5 × ATR` from the best price since entry.
- **Breakeven** — once price advances `1 × ATR` in favour, the stop is moved to
  the entry price. The stop only ever tightens, never loosens.

### About the RSI-cross lookback

A dip deep enough to push RSI to 30 also drags the fast EMA below the slow EMA
and leaves price below the fast EMA — so the four long conditions essentially
never align on the *exact* cross candle. This strategy is designed to enter on
the **recovery**: once the trend re-aligns and price reclaims the fast EMA. The
`rsi_cross_lookback` parameter (default 30) keeps the cross valid as a setup for
that recovery window. Set it to `1` for strict same-bar behaviour (which will
trade very rarely).

> **Note on results.** The bundled synthetic data is random-walk-like, so this
> simple strategy trades near break-even after costs on it — as expected. The
> value here is a *correct, complete, well-tested* framework: plug in your own
> data via `--csv`, optimise, and validate before risking capital. Backtest
> performance is never a guarantee of future results.

---

## Performance report

`compute_metrics` / the console report include:

- Net profit, total return %, annualized return %
- Number of trades, wins/losses, win rate
- Average win, average loss, average trade, largest win/loss
- Profit factor, expectancy, risk/reward ratio
- Maximum drawdown, Sharpe ratio, Sortino ratio
- Best winning streak, worst losing streak
- Average holding time (periods)
- Monthly returns (via the JSON export / charts)

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `ModuleNotFoundError: config` | Run from inside `trading-bot/` (or rely on `conftest.py` for tests). |
| Backtest reports **0 trades** | The setup is selective; use more candles (`--periods 8000+`), a trending regime, or lower `rsi_cross_lookback` sensitivity. See the lookback note above. |
| `ExchangeError: ccxt is required` | `pip install ccxt` for live trading. |
| Live refuses to start | Set `EXCHANGE_API_KEY`/`EXCHANGE_API_SECRET` and pass `--i-understand-the-risk`. |
| Charts not created | Pass `--charts DIR`; matplotlib uses the headless `Agg` backend so no display is needed. |
| `OHLCV data contains NaN values` | Your CSV has gaps; clean it before loading. |

---

## Disclaimer

This software is provided for educational and research purposes only. It is not
financial advice. Trading involves substantial risk of loss. Use at your own
risk, and never trade with money you cannot afford to lose.
