"""Command-line entry point for the trading bot.

Sub-commands
------------
``backtest``   Run a single backtest and print/plot a performance report.
``paper``      Run paper trading against a (synthetic or CSV) candle feed.
``optimize``   Run walk-forward optimization and report out-of-sample results.
``validate``   Backtest across multiple market regimes and summarise each.
``live``       Run live trading (requires ccxt and API credentials).

Run ``python main.py <command> --help`` for command-specific options.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import replace
from typing import Optional

import pandas as pd

from backtesting.engine import Backtester
from backtesting.metrics import PerformanceReport, compute_metrics
from bot_logging import get_logger
from config import Config, get_config
from data.loader import generate_synthetic_ohlcv, load_csv
from exchange.paper import PaperBroker
from optimization.optimizer import walk_forward
from trading_engine import TradingEngine


def _load_candles(args: argparse.Namespace) -> pd.DataFrame:
    """Load candles from CSV when given, otherwise generate synthetic data."""

    if getattr(args, "csv", None):
        return load_csv(args.csv)
    return generate_synthetic_ohlcv(
        periods=args.periods,
        regime=args.regime,
        freq=args.timeframe,
        seed=args.seed,
    )


def _format_report(report: PerformanceReport) -> str:
    """Return a human-readable multi-line summary of *report*."""

    lines = [
        "=" * 52,
        "           PERFORMANCE REPORT",
        "=" * 52,
        f"Initial balance      : {report.initial_balance:>14,.2f}",
        f"Final equity         : {report.final_equity:>14,.2f}",
        f"Net profit           : {report.net_profit:>14,.2f}",
        f"Total return         : {report.total_return_pct:>13.2f}%",
        f"Annualized return    : {report.annualized_return_pct:>13.2f}%",
        "-" * 52,
        f"Trades               : {report.num_trades:>14d}",
        f"Wins / Losses        : {report.num_wins:>6d} / {report.num_losses:<6d}",
        f"Win rate             : {report.win_rate:>13.2f}%",
        f"Average win          : {report.avg_win:>14,.2f}",
        f"Average loss         : {report.avg_loss:>14,.2f}",
        f"Average trade        : {report.avg_trade:>14,.2f}",
        f"Largest win          : {report.largest_win:>14,.2f}",
        f"Largest loss         : {report.largest_loss:>14,.2f}",
        "-" * 52,
        f"Profit factor        : {report.profit_factor:>14.2f}",
        f"Expectancy           : {report.expectancy:>14,.2f}",
        f"Risk / reward        : {report.risk_reward_ratio:>14.2f}",
        f"Max drawdown         : {report.max_drawdown_pct:>13.2f}%",
        f"Sharpe ratio         : {report.sharpe_ratio:>14.2f}",
        f"Sortino ratio        : {report.sortino_ratio:>14.2f}",
        "-" * 52,
        f"Best winning streak  : {report.best_winning_streak:>14d}",
        f"Worst losing streak  : {report.worst_losing_streak:>14d}",
        f"Avg holding (periods): {report.avg_holding_periods:>14.1f}",
        "=" * 52,
    ]
    return "\n".join(lines)


def _report_from_result(config: Config, result) -> PerformanceReport:
    """Compute a performance report from a backtest result."""

    return compute_metrics(
        result.equity_curve,
        result.trades,
        config.backtest.initial_balance,
        config.backtest.periods_per_year,
        config.backtest.risk_free_rate,
    )


def cmd_backtest(args: argparse.Namespace, config: Config) -> int:
    """Run a single backtest."""

    log = get_logger("main", config.logging)
    candles = _load_candles(args)
    log.info("Backtesting over %d candles (regime=%s)", len(candles), args.regime)

    result = Backtester(config).run(candles)
    report = _report_from_result(config, result)
    print(_format_report(report))

    if args.charts:
        from backtesting.plots import generate_all_charts

        paths = generate_all_charts(
            result.equity_curve, result.data, result.trades, report, args.charts
        )
        print("\nCharts written:")
        for p in paths:
            print(f"  - {p}")

    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump(report.to_dict(), fh, indent=2, default=str)
        print(f"\nReport JSON written to {args.json}")
    return 0


def cmd_paper(args: argparse.Namespace, config: Config) -> int:
    """Run paper trading over a candle feed, streaming candle-by-candle."""

    log = get_logger("main", config.logging)
    candles = _load_candles(args)
    broker = PaperBroker(config.backtest.initial_balance, config.costs)
    engine = TradingEngine(config, broker)

    warmup = max(
        config.indicators.ema_slow_period,
        config.indicators.atr_average_period,
    ) + 2
    log.info("Paper trading over %d candles (warmup=%d)", len(candles), warmup)

    for i in range(warmup, len(candles) + 1):
        window = candles.iloc[:i]
        engine.on_candles(window)

    # Flatten any residual position at the last price.
    if broker.get_position() is not None:
        last_price = float(candles.iloc[-1]["close"])
        broker.close_position(last_price, candles.index[-1], "session_end")

    equity_curve = _paper_equity_curve(broker, candles)
    report = compute_metrics(
        equity_curve,
        broker.trades,
        config.backtest.initial_balance,
        config.backtest.periods_per_year,
        config.backtest.risk_free_rate,
    )
    print(_format_report(report))
    print(f"\nFinal paper balance: {broker.get_balance():,.2f}")
    return 0


def _paper_equity_curve(broker: PaperBroker, candles: pd.DataFrame) -> pd.Series:
    """Build an equity curve from a paper broker's realised trades."""

    balance = broker.get_balance() - sum(t.pnl for t in broker.trades)
    times = [candles.index[0]]
    values = [balance]
    for t in broker.trades:
        balance += t.pnl
        times.append(t.exit_time)
        values.append(balance)
    return pd.Series(values, index=pd.DatetimeIndex(times))


def cmd_optimize(args: argparse.Namespace, config: Config) -> int:
    """Run walk-forward optimization."""

    log = get_logger("main", config.logging)
    candles = _load_candles(args)
    log.info("Walk-forward optimization over %d candles", len(candles))

    wf = walk_forward(config, candles)
    summary = wf.summary()
    if not summary:
        print("Not enough data for walk-forward optimization.")
        return 1

    print("Walk-forward out-of-sample summary:")
    print(json.dumps(summary, indent=2, default=str))
    print("\nChosen parameters per window:")
    for i, params in enumerate(wf.chosen_parameters, start=1):
        print(f"  Window {i}: {params}")
    return 0


def cmd_validate(args: argparse.Namespace, config: Config) -> int:
    """Backtest across several market regimes and summarise each."""

    regimes = ["bull", "bear", "sideways", "high_vol", "low_vol"]
    rows = []
    for regime in regimes:
        candles = generate_synthetic_ohlcv(
            periods=args.periods, regime=regime, freq=args.timeframe, seed=args.seed
        )
        result = Backtester(config).run(candles)
        report = _report_from_result(config, result)
        rows.append(
            {
                "regime": regime,
                "trades": report.num_trades,
                "return_%": round(report.total_return_pct, 2),
                "win_rate_%": round(report.win_rate, 1),
                "max_dd_%": round(report.max_drawdown_pct, 1),
                "sharpe": round(report.sharpe_ratio, 2),
                "profit_factor": round(report.profit_factor, 2),
            }
        )
    print(pd.DataFrame(rows).to_string(index=False))
    return 0


def cmd_live(args: argparse.Namespace, config: Config) -> int:
    """Run live trading (requires ccxt + credentials). Guarded for safety."""

    from config import ExchangeConfig

    log = get_logger("main", config.logging)
    exch = ExchangeConfig.from_env(config.exchange)
    if not exch.api_key or not exch.api_secret:
        print(
            "Live trading requires EXCHANGE_API_KEY and EXCHANGE_API_SECRET "
            "environment variables.",
            file=sys.stderr,
        )
        return 2
    if not args.i_understand_the_risk:
        print(
            "Refusing to start live trading without --i-understand-the-risk.",
            file=sys.stderr,
        )
        return 2

    from exchange.live import CCXTBroker

    config = replace(config, exchange=exch)
    broker = CCXTBroker(exch, config.costs, config.logging)
    broker.synchronise()
    engine = TradingEngine(config, broker)
    log.info("Live trading started on %s %s", exch.name, exch.symbol)
    print(
        "Live loop scaffold ready. Wire this to your candle scheduler to run "
        "continuously. See README 'Live Trading'."
    )
    # A production deployment schedules on candle close; we expose the pieces
    # rather than block here so the entry point stays testable.
    return 0


def build_parser() -> argparse.ArgumentParser:
    """Construct the top-level argument parser."""

    parser = argparse.ArgumentParser(description="EMA+RSI+ATR trading bot")
    sub = parser.add_subparsers(dest="command", required=True)

    def add_common(p: argparse.ArgumentParser) -> None:
        p.add_argument("--csv", help="Path to an OHLCV CSV file")
        p.add_argument("--periods", type=int, default=8000, help="Synthetic candles")
        p.add_argument("--regime", default="bull",
                       choices=["bull", "bear", "sideways", "high_vol", "low_vol"])
        p.add_argument("--timeframe", default="1h", help="Candle frequency")
        p.add_argument("--seed", type=int, default=42, help="RNG seed")

    p_bt = sub.add_parser("backtest", help="Run a single backtest")
    add_common(p_bt)
    p_bt.add_argument("--charts", help="Directory to write charts into")
    p_bt.add_argument("--json", help="Path to write the report JSON")

    p_paper = sub.add_parser("paper", help="Run paper trading")
    add_common(p_paper)

    p_opt = sub.add_parser("optimize", help="Walk-forward optimization")
    add_common(p_opt)

    p_val = sub.add_parser("validate", help="Backtest across market regimes")
    add_common(p_val)

    p_live = sub.add_parser("live", help="Run live trading (ccxt)")
    p_live.add_argument("--i-understand-the-risk", action="store_true",
                        dest="i_understand_the_risk")

    return parser


def main(argv: Optional[list[str]] = None) -> int:
    """Program entry point. Returns a process exit code."""

    parser = build_parser()
    args = parser.parse_args(argv)
    config = get_config()

    dispatch = {
        "backtest": cmd_backtest,
        "paper": cmd_paper,
        "optimize": cmd_optimize,
        "validate": cmd_validate,
        "live": cmd_live,
    }
    handler = dispatch[args.command]
    return handler(args, config)


if __name__ == "__main__":
    raise SystemExit(main())
