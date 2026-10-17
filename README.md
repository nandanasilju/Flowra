# Flowra: Intelligent Period Tracker & Women's Health Platform

> **Revolutionizing reproductive health through voice-to-text logging, pattern-based disease detection, and integrated clinical commerce.**

---

## The Problem
Traditional period-tracking applications are built exclusively for cycle prediction and basic fertility windows, ignoring the broader landscape of chronic reproductive disorders like endometriosis—which takes 7–9 years on average to diagnose. Users struggle with high-friction daily logging and lack tools that extract meaningful clinical red flags from their day-to-day symptom patterns.

---

## The Solution: Flowra
Flowra is an advanced period-tracking and health platform that converts routine logs and voice updates into clinical insights, early risk detection, and seamless lifestyle support.

### Core Features & Architecture
1. **Voice-to-Text Updates:** Low-friction, natural language logging that allows users to speak their symptoms (e.g., *"bad cramps today, couldn't get out of bed, bloated"*) directly into structured logs.
2. **Pattern-Based Disease Detection:** Analyzes time-series tracking data to surface recurring symptom clusters, cyclical pain flares, and indicators of conditions like endometriosis.
3. **Menstruation-Specific Shopping Cart:** An integrated commerce experience tailored to menstrual health needs, offering curated relief products, supplements, and comfort essentials mapped to cycle phases.
4. **Clinical Summary & Export:** Generates structured reports designed to bridge the communication gap between patients and healthcare professionals during consultations.

---

## Features & Roadmap

| Feature | MVP Status | Description |
| :--- | :--- | :--- |
| **Voice-to-Text Logging** | **Live** | Speech-to-text input parsed automatically into structured symptom models. |
| **Cycle & Phase Tracking** | **Live** | Core tracking of bleeding, pain scales, mood, and fatigue. |
| **Disease Detection Engine** | **Live** | Pattern recognition algorithm flagging chronic acyclical pain and anomaly clusters. |
| **Menstrual Shopping Cart** | **Live** | E-commerce integration featuring targeted wellness and comfort products. |
| **Clinician Report PDF** | **Roadmap** | Single-page doctor-ready export summarizing multi-cycle trends. |

---

## Business Model & Monetization Strategy

Flowra operates on a high-growth **D2C and B2B hybrid model**:
* **In-App Commerce Margins:** Monetizing the menstruation-specific shopping cart through direct brand partnerships and curated wellness product sales.
* **Premium Health Insights:** Offering advanced predictive analytics, deep health reports, and extended history tracking via a freemium subscription model.
* **B2B Clinic & Enterprise Partnerships:** Providing structured patient insights to specialized women's health clinics and corporate wellness programs.

---

## Tech Stack

* **Frontend:** React.js / Next.js, Tailwind CSS, Web Speech API for voice-to-text inputs.
* **Backend:** Node.js, Express, Local Secure Storage / SQLite.
* **AI & Analytics:** LLM and time-series pattern matching models for symptom parsing and disease risk detection.

---

## Getting Started Locally

```bash
# Clone the repository
git clone [https://github.com/your-team/flowra.git](https://github.com/your-team/flowra.git)

# Navigate to the project directory
cd flowra

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```

---

## Privacy Architecture

Designed with a strict privacy-first architecture: sensitive user health data and voice notes remain securely encrypted, ensuring compliance and complete user control over data export and deletion.
