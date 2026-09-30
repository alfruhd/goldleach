# GoldLeach — Dynamic Leach Chemistry & Reagent Controller

A mobile-first, offline-first Progressive Web App (PWA) designed for small-to-mid scale gold vat-leaching and Carbon-in-Leach (CIL) operations. Built strictly according to the **Technical Specification: Dynamic Leach Chemistry & Reagent Calculator**.

---

## ⚡ Core Features

1. **Dynamic Chemical Dosing Engine (`src/lib/metallurgyEngine.ts`)**:
   - **Hydrated Lime ($\text{Ca(OH)}_2$) Addition**: Buffers slurry safely to a target of $\text{pH } 10.8$ (strictly $\ge 10.5$) preventing hazardous Hydrogen Cyanide ($\text{HCN}$) gas generation.
   - **Sodium Cyanide ($\text{NaCN}$) Charge**: Stoichiometric dosing based on active water volume and ore cyanicide profiles (Clean Silica, Moderate Sulfide, High Copper).
   - **Taggart's Percent Solids Relation**: Computes dry ore tonnage and displacement active solution volume.
   - **Kinetic Replenishment Rate**: Hourly top-up rate based on 35% consumption demand over leach cycle.

2. **Zero-Latency Offline Persistence (`src/lib/db.ts`)**:
   - Built on **Dexie.js** (IndexedDB).
   - Pre-seeded with standard vats (Rectangular East Vat #1 and Agitated Circular Leach Tank #2).
   - Full batch logging with audit-ready codes (`B-YYYYMMDD-XXX`).

3. **Batch History Ledger & RFC 4180 CSV Export (`src/lib/exportCsv.ts`)**:
   - In-memory generation of CSV audit reports (`goldleach_audit_YYYYMMDD.csv`).
   - Chronological batch log with dry ore, lime, cyanide, and local storage tags.

4. **Vat & Tank Geometry Management**:
   - Dynamic support for **Rectangular Vats** (Length $\times$ Width) and **Circular Tanks** (Diameter).
   - Live boundary validation ensuring slurry fill depth never exceeds vat wall height limit.

5. **Field-Optimized Dark Theme & PWA Capabilities**:
   - High-contrast color scheme (`#0b0d17` background, amber-500 lime alerts, cyan-500 cyanide alerts).
   - Legible in high-glare sunlight field conditions.
   - Service worker (`public/sw.js`) and Web App Manifest (`public/manifest.json`) for full airplane mode/offline execution.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Run Acceptance Benchmark Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 📐 Acceptance Test Benchmark Verification

| Metric | Spec Target | Engine Output | Status |
| :--- | :--- | :--- | :--- |
| **Total Slurry Volume** | $48.00\text{ m}^3$ | `48.00 m³` | ✅ Match |
| **Slurry Specific Gravity** | $1.380\text{ SG}$ | `1.380` | ✅ Match |
| **Percent Solids (% Solids)** | $44.2\%$ | `44.2%` | ✅ Match |
| **Total Slurry Mass** | $66.24\text{ tons}$ | `66.24 t` | ✅ Match |
| **Dry Ore Tonnage** | $29.3\text{ tons}$ | `29.3 t` | ✅ Match |
| **Active Water Volume** | $36.95\text{ m}^3$ | `36.95 m³` | ✅ Match |
| **$\Delta\text{pH}$ Buffer Demand** | $2.4\text{ pH}$ | `2.4` | ✅ Match |
| **Hydrated Lime Required** | **$39.9\text{ kg}$** | **`39.9 kg`** | ✅ Match |
| **Sodium Cyanide Required** | **$9.4\text{ kg}$** | **`9.4 kg`** | ✅ Match |
| **Kinetic Hourly Rate** | $0.09\text{ kg/hr}$ | `0.09 kg/hr` | ✅ Match |
