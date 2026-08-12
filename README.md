# AgriVision AI - Multi-Crop Plant Disease Detection PWA

**AgriVision AI** is an AI-powered Progressive Web Application (PWA) designed to assist smallholder farmers in early plant disease identification, diagnostic explainability (LIME visual heatmaps), and immediate actionable guidance.

This project implements the **First 20% Milestone** for CS Final Year Project Interim Review 1, adhering to the architecture described in the 2025 IEEE Access research paper:
> *"Hierarchical Multi-Stage Framework for Robust and Explainable Tomato Leaf Disease Identification"*

---

## 🚀 IEEE 4-Stage AI Pipeline Architecture

The application abstracts the 4-stage pipeline for interim demonstration:
1. **YOLO11**: Leaf detection and bounding box localization.
2. **SAM (Segment Anything Model)**: Background noise removal and leaf contour isolation.
3. **ResNet-50**: Deep convolutional feature extraction and disease classification.
4. **LIME (Local Interpretable Model-agnostic Explanations)**: Superpixel feature importance heatmaps.

---

## 🛠️ Technology Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Architecture**: Progressive Web App (PWA) with Service Worker shell caching & Web App Manifest
- **Deployment**: Vercel SPA ready (`vercel.json` rewrite routing)

---

## 🏃 Local Development Instructions

1. Open a terminal inside the project directory:
   ```bash
   cd agrivision-ai
   ```

2. Start the Vite local development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:3000`.

---

## 🌐 1-Click Vercel Deployment Guide

To deploy this PWA to Vercel so it can be accessed directly on mobile smartphones:

### Option A: Using Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option B: Via GitHub Repository
1. Push this code repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Keep framework preset as **Vite**.
5. Click **Deploy**.

`vercel.json` is pre-configured to handle SPA client-side routing on Vercel seamlessly.
