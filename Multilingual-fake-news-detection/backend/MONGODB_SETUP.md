# MongoDB Atlas Setup Guide

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new project (e.g., "Fake News Detection")

### 2. Create a Free Cluster
1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select a cloud provider and region (closest to you)
4. Name your cluster (e.g., "fake-news-cluster")
5. Click "Create"

### 3. Create Database User
1. Go to **Database Access** (left sidebar)
2. Click "Add New Database User"
3. Choose **Password** authentication
4. Username: `fakenews_user` (or your choice)
5. **Auto-generate secure password** or create your own
6. **⚠️ SAVE THIS PASSWORD** - you'll need it for connection string
7. Set user privileges: **Read and write to any database**
8. Click "Add User"

### 4. Configure Network Access
1. Go to **Network Access** (left sidebar)
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses
4. Click "Confirm"

### 5. Get Connection String
1. Go to **Database** (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: **Python**, Version: **3.12 or later**
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@fake-news-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 6. Configure Your Application

#### Option 1: Using .env file (Recommended)
1. Create/edit `.env` file in the `backend/` directory:
   ```env
   NEWSAPI_KEY=8925bb69af6f474ca52a00388fb0b860
   MONGODB_URI=mongodb+srv://<username>:<password>@fake-news-cluster.xxxxx.mongodb.net/fake_news_detection?retryWrites=true&w=majority
   ```

2. **Replace placeholders**:
   - `<username>`: Your database username (e.g., `fakenews_user`)
   - `<password>`: The password you saved earlier
   - `xxxxx`: Your cluster ID (from connection string)

3. **Important**: Add database name `/fake_news_detection` before the `?` in the connection string

#### Option 2: Environment Variable (PowerShell)
```powershell
$env:MONGODB_URI = "mongodb+srv://fakenews_user:YOUR_PASSWORD@fake-news-cluster.xxxxx.mongodb.net/fake_news_detection?retryWrites=true&w=majority"
```

#### Option 3: Update start.bat
Edit `backend/start.bat`:
```batch
@echo off
cd /d "%~dp0"
set NEWSAPI_KEY=8925bb69af6f474ca52a00388fb0b860
set MONGODB_URI=mongodb+srv://fakenews_user:YOUR_PASSWORD@fake-news-cluster.xxxxx.mongodb.net/fake_news_detection?retryWrites=true&w=majority
.\venv310\Scripts\python.exe app.py
```

### 7. Install MongoDB Dependencies
```powershell
cd backend
.\venv310\Scripts\pip install pymongo dnspython
```

### 8. Test Connection
Start your backend:
```powershell
cd backend
.\start.bat
```

You should see:
```
============================================================
  🤖 FAKE NEWS DETECTION API - Starting Server
============================================================
⚙️  Loading ML Model... ✅
💾 MongoDB Atlas: ✅ Connected
============================================================
```

## Database Structure

The system creates the following collections automatically:

### `predictions` Collection
Stores all prediction results:
```json
{
  "_id": "ObjectId",
  "timestamp": "2026-03-07T10:30:00Z",
  "prediction_type": "text|url|image|claim",
  "text": "News content...",
  "prediction": "FAKE|REAL",
  "confidence": 87.5,
  "is_fake": true,
  "language": "en",
  "ml_confidence": 85.2,
  "knowledge_flags": 2,
  "api_verified": true
}
```

### `analytics` Collection
Daily statistics:
```json
{
  "_id": "ObjectId",
  "date": "2026-03-07",
  "total_predictions": 150,
  "fake_predictions": 95,
  "real_predictions": 55,
  "by_type": {
    "text": 80,
    "url": 40,
    "image": 20,
    "claim": 10
  }
}
```

## New API Endpoints

### Get Prediction History
```http
GET /api/history?limit=50&type=text
```
Returns recent predictions.

**Query params:**
- `limit`: Number of predictions (default: 50)
- `type`: Filter by type (text/url/image/claim)

### Get Analytics
```http
GET /api/analytics?days=30
```
Returns daily statistics and summary.

**Query params:**
- `days`: Number of days (default: 30)

### Get Overall Stats
```http
GET /api/stats
```
Returns total counts and breakdowns.

## Troubleshooting

### ❌ "MongoDB connection failed"
- Check your connection string has correct username/password
- Verify network access allows your IP (0.0.0.0/0 for development)
- Ensure database name is included: `/fake_news_detection`
- Check cluster is running (not paused)

### ⚠️ "MongoDB not configured"
- System runs fine without MongoDB
- Predictions still work, just not saved to database
- Add MONGODB_URI to enable storage

### Connection timeout
- Check your internet connection
- Verify MongoDB Atlas cluster is running
- Try a different region/cluster if issues persist

## Running Without MongoDB

The system works **perfectly fine without MongoDB**:
- All prediction features work normally
- History and analytics endpoints return empty results
- No errors - graceful degradation

MongoDB is **optional** for:
- Storing prediction history
- Analytics dashboards
- User tracking (future feature)
- Historical analysis

## Security Best Practices

1. **Never commit .env file** to git
   - Already in `.gitignore`
   - Use `.env.example` for templates

2. **Use strong passwords**
   - Auto-generated passwords are recommended
   - Change default passwords

3. **Restrict network access in production**
   - Use specific IP addresses
   - Don't use 0.0.0.0/0 in production

4. **Rotate credentials regularly**
   - Change passwords every 90 days
   - Update connection strings

## Free Tier Limits

MongoDB Atlas M0 (Free) tier includes:
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Shared vCPU
- ✅ ~3,000 predictions stored (est.)
- ✅ Perfect for development and testing

**Enough for**: Testing, development, small production workloads

**Upgrade needed for**: High-volume production (1000+ predictions/day)

## Questions?

Check the [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/) or run the backend - it provides helpful error messages!
