# Backend Guide

This folder contains the Flask API for the Fake News Detection System.

## 1. Main Entry

- Run file: `app.py`
- Base URL: `http://localhost:5000`
- API base: `http://localhost:5000/api`

## 2. Start Backend (Windows)

From project root:

```powershell
Set-Location backend
.\venv310\Scripts\python.exe app.py
```

If you are already inside `backend`:

```powershell
.\venv310\Scripts\python.exe app.py
```

## 3. Install Dependencies

```powershell
Set-Location backend
.\venv310\Scripts\python.exe -m pip install -r requirements.txt
```

## 4. Environment Setup

```powershell
copy .env.example .env
```

Update `.env` with your keys/config values as needed.

Important keys:

- `MONGODB_URI`
- `GEMINI_API_KEY` (optional)
- `OPENAI_API_KEY` (optional)
- `NEWSAPI_KEY` (optional)
- `TESSERACT_CMD` (if Tesseract not in PATH)

## 5. Core Endpoints

### Health & system

- `GET /api/health`
- `GET /api/model-metrics`

### Predictions

- `POST /api/predict-text`
- `POST /api/predict-url`
- `POST /api/predict-image`
- `POST /api/verify-claim`
- `POST /api/source-credibility`

### User/account

- `GET /api/profile`
- `POST /api/profile`
- `POST /api/change-password`
- `POST /api/delete-account`

### User-scoped data

- `GET /api/history`
- `GET /api/analytics`
- `GET /api/stats`

Note: user-scoped requests use `user_email` passed by frontend.

## 6. Service Layout

- `services/fake_news_service.py` — ML prediction
- `services/openai_verification_service.py` — LLM verification layer
- `services/fusion_service.py` — fusion scoring/decision
- `services/ocr_service.py` — image OCR
- `services/mongodb_service.py` — profile/history/analytics/account storage
- `services/cloudinary_service.py` — optional image cloud upload
- `utils/text_processor.py` — text/language utilities
- `utils/url_scraper.py` — URL extraction

## 7. Data Behavior

- Predictions are stored with `user_email`.
- New account starts with empty history/stats until predictions are made.
- Password change stores bcrypt hash in MongoDB.
- Delete account removes user profile + user prediction records.

## 8. Troubleshooting

### Module import errors

Install with the same interpreter used to run app:

```powershell
.\venv310\Scripts\python.exe -m pip install -r requirements.txt
```

### Path issue: `...backend\backend`

If terminal is already in backend, do not run `Set-Location backend` again.

### MongoDB DNS errors (`getaddrinfo failed`)

- Check internet stability
- Verify Atlas IP allowlist
- Flush DNS: `ipconfig /flushdns`

### Tesseract not found

- Install Tesseract
- Add to PATH or set `TESSERACT_CMD` in `.env`

## 9. Training Requirements

- Runtime dependencies: `requirements.txt`
- Training/experiment extras: `requirements-training.txt`
