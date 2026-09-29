# Synthetic Local Weather Targets

## 1. Why Synthetic Targets Are Used
In the current prototype phase of **Panchayat Weather Intelligence**, long-term daily in-situ station observations across all 31 Panchayats in the Nilgiris are not freely downloadable via unrestricted public APIs (as established during the independent weather source audit, historical daily records from IMD observatories require administrative data requests via `dsp.imdpune.gov.in`).

To develop and test the **Random Forest downscaling pipeline, cold-start donor selection, and bias-correction architecture** without stalling, a clean, physically plausible synthetic target dataset is provided.

---

## 2. Real vs. Synthetic Data Provenance

| Component | Provenance | Source Dataset | Notes |
| :--- | :--- | :--- | :--- |
| **Coarse Weather Inputs** | **REAL** | INDmet 0.05° Gridded Data (`Zenodo 15430548`) | Real 1981–2024 daily precipitation, Tmax, and Tmin. |
| **Panchayat Topography** | **REAL** | Copernicus GLO-30 DEM (30m) | Real elevation (782m to 2234m), slope, aspect, and TRI. |
| **Panchayat Land Cover** | **REAL** | ESA WorldCover 2021 (10m) | Real cropland, forest, built-up, and water fractions. |
| **Panchayat Vegetation** | **REAL** | Sentinel-2 L2A (10m) | Real NDVI vegetation indices. |
| **Local Weather Targets** | **SYNTHETIC** | Generated via `build_synthetic_weather_targets.py` | `synthetic_rainfall_mm`, `synthetic_tmax_c`, `synthetic_tmin_c`. |

---

## 3. How the Synthetic Targets Are Generated

The synthetic local weather targets are computed deterministically from real coarse meteorology and high-resolution environmental features:

### A. Temperature (Tmax & Tmin)
$$\Delta T_{\text{elev}} = -0.0065 \times (\text{elevation\_m} - 1600.0)$$
* **Lapse Rate:** Standard environmental lapse rate of $0.0065\text{ }^\circ\text{C}/\text{m}$ ($6.5\text{ }^\circ\text{C}/\text{km}$) applied relative to the regional mean elevation ($1600\text{ m}$).
* **Solar Radiation:** Aspect and slope modulation (SE slopes receive enhanced daytime heating).
* **Canopy & Urban Effects:** Forest canopy cooling for $T_{\text{max}}$ ($-0.40 \times \text{forest\_fraction}$), night-time buffering for $T_{\text{min}}$ ($+0.25 \times \text{forest\_fraction}$), and built-up thermal retention ($+0.30 \times \text{builtup\_fraction}$).
* **Physical Constraint:** $T_{\text{max}} \ge T_{\text{min}} + 2.0\text{ }^\circ\text{C}$ strictly enforced.

### B. Precipitation (Rainfall)
$$P_{\text{syn}} = \max\left(0.0, P_{\text{coarse}} \times F_{\text{local}} \times (1.0 + \eta)\right)$$
* **Dry Day Preservation:** If $P_{\text{coarse}} = 0.0$, $P_{\text{syn}} = 0.0$ strictly.
* **Orographic Multiplier:** $F_{\text{local}} = f_{\text{elev}} \times f_{\text{slope}} \times f_{\text{veg}} \in [0.70, 1.45]$.
* **Stochastic Perturbation:** $\eta \sim \mathcal{N}(0, 0.06)$ clipped to $[-0.15, 0.15]$ using fixed random seed `42`.

---

## 4. How to Regenerate the Dataset
To deterministically reproduce the exact synthetic target table:

```bash
backend/.venv/bin/python backend/scripts/build_synthetic_weather_targets.py
```

---

## 5. Scientific Limitation Statement
> **IMPORTANT:** These targets are **simulated prototype placeholders**. They are **NOT real measured observations** and must **NEVER** be presented as empirical ground truth or used to claim validated real-world forecast accuracy.

---

## 6. Seamless Future Real-Data Drop-In
The ML training and evaluation pipelines are designed to ingest targets via a standardized target column interface. When authentic station observations (e.g. IMD Ooty `43317` and Coonoor `43318`) are procured from IMD NDC Pune, the target columns can be mapped to:
* `observed_rainfall_mm`
* `observed_tmax_c`
* `observed_tmin_c`
* `target_source = "observed_imd_station"`

without altering any downstream feature engineering or ML model code.
