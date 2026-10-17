"""
Flowra research prototype: symptoms-only PCOS model.

Dataset: "Polycystic ovary syndrome (PCOS)" by Prasoon Kottarathil on Kaggle
(541 women, 10 hospitals in Kerala). Download the CSV/XLSX yourself (Kaggle sign-in) and run:

    pip install pandas scikit-learn openpyxl
    python train_pcos.py path/to/PCOS_data.csv            # or .xlsx

Only features a person can SELF-REPORT are used (no hormone tests, no ultrasound), because
those are what an app user can actually provide. The script compares three algorithms with
stratified 5-fold cross-validation, calibrates probabilities, reports metrics, and writes:
    results.json   metrics for every model
    model_card.md  plain-language model card (data, metrics, limitations)
This model is NOT used by the Flowra app. It is research, pending clinical validation.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (balanced_accuracy_score, brier_score_loss, f1_score, precision_score,
                             recall_score, roc_auc_score)
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

SEED = 42

# Self-reportable features. Keys = normalised column names in the Kaggle file.
FEATURES = {
    "age_yrs": "Age (years)",
    "bmi": "BMI",
    "cycle_r_i": "Irregular cycle (R=2 regular / I=4 irregular in the source)",
    "cycle_length_days": "Bleeding days (labelled 'Cycle length' in the source)",
    "weight_gain_y_n": "Weight gain",
    "hair_growth_y_n": "Excess hair growth",
    "skin_darkening_y_n": "Skin darkening",
    "hair_loss_y_n": "Hair loss",
    "pimples_y_n": "Acne / pimples",
    "fast_food_y_n": "Regular fast food",
    "reg_exercise_y_n": "Regular exercise",
}
TARGET = "pcos_y_n"


def norm(col: str) -> str:
    c = col.strip().lower()
    c = re.sub(r"[^a-z0-9]+", "_", c)
    return c.strip("_")


def load(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in {".xlsx", ".xls"}:
        xl = pd.ExcelFile(path)
        sheet = next((s for s in xl.sheet_names if "infertility" not in s.lower()), xl.sheet_names[0])
        df = xl.parse(sheet)
    else:
        df = pd.read_csv(path)
    df.columns = [norm(c) for c in df.columns]
    df = df.loc[:, ~df.columns.str.startswith("unnamed")]
    if "bmi" not in df.columns and {"weight_kg", "height_cm"} <= set(df.columns):
        df["bmi"] = pd.to_numeric(df["weight_kg"], errors="coerce") / (pd.to_numeric(df["height_cm"], errors="coerce") / 100) ** 2
    missing = [c for c in [TARGET, *FEATURES] if c not in df.columns]
    if missing:
        raise SystemExit(f"Columns not found: {missing}\nAvailable: {sorted(df.columns)}")
    out = df[[*FEATURES, TARGET]].apply(pd.to_numeric, errors="coerce")
    # Source encodes cycle as 2 = regular, 4 = irregular (5 appears rarely) -> 1 if irregular.
    out["cycle_r_i"] = (out["cycle_r_i"] >= 4).astype(float).where(out["cycle_r_i"].notna())
    return out.dropna(subset=[TARGET])


def models() -> dict[str, Pipeline]:
    def pipe(clf, scale=False):
        steps = [("impute", SimpleImputer(strategy="median"))]
        if scale:
            steps.append(("scale", StandardScaler()))
        steps.append(("clf", clf))
        return Pipeline(steps)

    return {
        "logistic_regression": pipe(LogisticRegression(max_iter=2000, class_weight="balanced", random_state=SEED), scale=True),
        "random_forest": pipe(RandomForestClassifier(n_estimators=400, min_samples_leaf=3, class_weight="balanced", random_state=SEED)),
        "gradient_boosting": pipe(HistGradientBoostingClassifier(max_depth=3, learning_rate=0.05, max_iter=300, random_state=SEED)),
    }


def evaluate(name: str, model: Pipeline, X: pd.DataFrame, y: np.ndarray) -> dict:
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    calibrated = CalibratedClassifierCV(model, method="isotonic", cv=3)
    proba = cross_val_predict(calibrated, X, y, cv=cv, method="predict_proba")[:, 1]
    pred = (proba >= 0.5).astype(int)
    return {
        "model": name,
        "roc_auc": round(float(roc_auc_score(y, proba)), 3),
        "balanced_accuracy": round(float(balanced_accuracy_score(y, pred)), 3),
        "sensitivity_recall": round(float(recall_score(y, pred)), 3),
        "specificity": round(float(recall_score(1 - y, 1 - pred)), 3),
        "precision": round(float(precision_score(y, pred, zero_division=0)), 3),
        "f1": round(float(f1_score(y, pred)), 3),
        "brier_score": round(float(brier_score_loss(y, proba)), 3),
    }


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    df = load(Path(sys.argv[1]))
    X = df[list(FEATURES)]
    y = df[TARGET].astype(int).to_numpy()
    print(f"Rows: {len(df)} · PCOS positive: {int(y.sum())} ({y.mean():.0%}) · features: {len(FEATURES)} (self-reported only)\n")

    results = [evaluate(n, m, X, y) for n, m in models().items()]
    results.sort(key=lambda r: r["roc_auc"], reverse=True)
    print(f"{'model':22} {'AUC':>6} {'bal.acc':>8} {'sens':>6} {'spec':>6} {'brier':>6}")
    for r in results:
        print(f"{r['model']:22} {r['roc_auc']:>6} {r['balanced_accuracy']:>8} {r['sensitivity_recall']:>6} {r['specificity']:>6} {r['brier_score']:>6}")

    best = models()[results[0]["model"]].fit(X, y)
    imp = permutation_importance(best, X, y, n_repeats=20, random_state=SEED, scoring="roc_auc")
    importance = sorted(({"feature": FEATURES[f], "importance": round(float(v), 4)} for f, v in zip(FEATURES, imp.importances_mean)), key=lambda d: -d["importance"])
    print("\nTop features (permutation importance, in-sample, indicative only):")
    for row in importance[:6]:
        print(f"  {row['feature']:<45} {row['importance']}")

    out = {"rows": int(len(df)), "positives": int(y.sum()), "features": list(FEATURES.values()), "cv": "stratified 5-fold, isotonic calibration", "results": results, "importance": importance}
    Path("results.json").write_text(json.dumps(out, indent=2))
    b = results[0]
    Path("model_card.md").write_text(f"""# Model card: Flowra symptoms-only PCOS model (research prototype)

**Status:** research only, not used in the Flowra app. Requires clinical validation before any use.

**Data:** Kaggle "Polycystic ovary syndrome (PCOS)" (Kottarathil), {len(df)} women from hospitals in Kerala, India; {int(y.sum())} with PCOS.
**Inputs ({len(FEATURES)}, all self-reportable):** {", ".join(FEATURES.values())}. Hormone and ultrasound columns are deliberately excluded.
**Method:** {", ".join(r["model"] for r in results)}; stratified 5-fold cross-validation; isotonic probability calibration; permutation feature importance.

**Best model:** {b["model"]}: ROC-AUC {b["roc_auc"]}, balanced accuracy {b["balanced_accuracy"]}, sensitivity {b["sensitivity_recall"]}, specificity {b["specificity"]}, Brier {b["brier_score"]}.

**Limitations:** small sample; patients from hospitals in one Indian state (referral bias; may not generalise); diagnosis criteria used in the source are not documented in detail; self-report fields may be inconsistent; not validated prospectively. Must never be presented to users as a diagnosis or a probability without clinical validation.
""")
    print("\nWrote results.json and model_card.md")


if __name__ == "__main__":
    main()
