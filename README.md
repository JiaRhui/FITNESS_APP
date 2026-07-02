# Daily Checklist Feature

This folder contains only the Daily Checklist feature in the requested format.

## Folder structure

```text
daily_checklist_feature/
├── data/
│   └── dailyChecklist.json
├── static/
│   ├── css/
│   │   └── style.css
│   ├── images/
│   │   └── rp-logo.png
│   └── js/
│       ├── app.js
│       └── habitTracker.js
├── templates/
│   └── DailyHabits.html
├── README.md
├── app.py
└── requirements.txt
```

## How to run

```bash
pip install -r requirements.txt
python app.py
```

Then open:

```text
http://127.0.0.1:5000/daily-checklist
```

## Notes

- This is only the Daily Checklist feature.
- The remaining project content was not reorganized.
- The checklist progress is saved using browser localStorage.
