# Placement & Internship Analytics Dashboard (PlacementStats)

A premium, interactive web dashboard designed to visualize and analyze placement and internship statistics (2025 - 2026). It parses raw Excel metrics using Python/Pandas and visualizes them on a sleek, responsive dashboard built with HTML, CSS (Glassmorphism theme), and Chart.js.

## 🚀 Features

- **Global Filter & Company Profile**: Analyze stats collectively or filter down to a specific company to view their visit date, category, offered CTC, and stipend.
- **Visual Analytics**: Interactive charts showing:
  - Placements by Branch
  - Top 5 Recruiters (Doughnut chart)
  - Internships by Branch
  - Top Internship Stipends
- **Searchable Student Lists**: Easily query students by name, branch, or company.
- **CTC & CGPA Statistics**: Detailed analysis of CTC clustering, CGPA ranges, and branch-wise performance.

---

## 🛠️ Tech Stack

- **Data Processing**: Python 3, Pandas, OpenPyXL
- **Frontend**: HTML5, Vanilla CSS (Custom properties, HSL color palettes, Glassmorphism gradients), Vanilla JavaScript
- **Libraries**: Chart.js (via CDN), Google Fonts (Inter)

---

## 💻 How to Run

### 1. Data Conversion
To regenerate or update the dashboard data from the Excel spreadsheet, run:
```bash
python convert_data.py
```
This updates the data store at `dashboard/data.js`.

### 2. View the Dashboard
Start a local server to view the dashboard:
```bash
python -m http.server 8000 -d dashboard
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.
