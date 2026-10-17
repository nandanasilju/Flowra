# Research: symptoms-only PCOS model

A transparent, reproducible training pipeline for a PCOS model that uses **only features a person can self-report** (cycle regularity, weight gain, hair growth, skin darkening, hair loss, acne, BMI, lifestyle). It is **not used in the Flowra app**; the app's pattern engine is rule-based and explainable. This exists to evaluate, honestly, what a symptoms-only model can and can't do.

## Run
1. Download the dataset from Kaggle: "Polycystic ovary syndrome (PCOS)" by Prasoon Kottarathil (free account needed). Use the file with the PCOS (Y/N) column (the "without infertility" sheet if it's an Excel file).
2. `pip install pandas scikit-learn openpyxl`
3. `python train_pcos.py PCOS_data_without_infertility.xlsx`

Outputs `results.json` and `model_card.md` with cross-validated ROC-AUC, balanced accuracy, sensitivity, specificity and calibration (Brier score) for logistic regression, random forest and gradient boosting.

## Why it isn't in the app
- 541 patients from hospitals in one state is too small and too specific to be safe for the public.
- Published results on this dataset that reach ~90% accuracy use hormone and ultrasound data, which app users don't have; a symptoms-only model will score lower.
- Showing a disease probability to users without clinical validation would be misleading. Flowra shows explainable patterns instead.
