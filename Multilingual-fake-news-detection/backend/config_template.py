"""
API Configuration Template
Copy this to .env file or set as environment variables
"""

# =============================================================================
# NEWSAPI - News Verification (FREE)
# =============================================================================
# Sign up at: https://newsapi.org/register
# Free Tier: 100 requests/day
# 
# Steps:
# 1. Go to https://newsapi.org/register
# 2. Enter email and create account
# 3. Copy your API key from dashboard
# 4. Set environment variable: NEWSAPI_KEY=your_key_here
#
# Example:
# NEWSAPI_KEY=abc123def456ghi789jkl012mno345pqr678

# =============================================================================
# OPENAI - Multilingual verification layer (OPTIONAL but recommended)
# =============================================================================
# Set your OpenAI API key to enable multilingual LLM verification before fusion.
# OPENAI_API_KEY=your_openai_api_key_here
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_TIMEOUT_SECONDS=20

# =============================================================================
# GEMINI - Alternative multilingual verification layer
# =============================================================================
# Preferred when you want to replace OpenAI with Gemini.
# GEMINI_API_KEY=your_gemini_api_key_here
# GEMINI_MODEL=gemini-2.0-flash
# LLM_PROVIDER=gemini

# =============================================================================
# OLLAMA - Local fallback LLM (No per-request billing)
# =============================================================================
# Install Ollama locally and pull a Qwen model for multilingual verification.
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=qwen2.5:3b
# OLLAMA_VISION_MODEL=gemma3:1b
# LLM_PROVIDER=auto

# Optional resilience tuning for unstable DNS/connectivity:
# TRANSLATION_DNS_BACKOFF_SECONDS=180
# CLOUDINARY_UPLOAD_ENABLED=True
# CLOUDINARY_DNS_BACKOFF_SECONDS=180

# =============================================================================
# CRYPTO PRICES - Currently Active (NO KEY NEEDED)
# =============================================================================
# CoinGecko API - Already working!
# No API key required
# Unlimited requests on free tier

# =============================================================================
# STOCK MARKET APIs (Optional - Choose One)
# =============================================================================

# Option 1: Finnhub (Recommended)
# Sign up at: https://finnhub.io/register
# Free Tier: 60 requests/minute
# FINNHUB_API_KEY=your_key_here

# Option 2: Twelve Data
# Sign up at: https://twelvedata.com/
# Free Tier: 800 requests/day
# TWELVEDATA_API_KEY=your_key_here

# Option 3: Alpha Vantage
# Sign up at: https://www.alphavantage.co/support/#api-key
# Free Tier: 25 requests/day
# ALPHAVANTAGE_API_KEY=your_key_here

# =============================================================================
# HOW TO SET ENVIRONMENT VARIABLES
# =============================================================================

# Windows PowerShell (Temporary - Current Session):
# $env:NEWSAPI_KEY = "your_key_here"

# Windows PowerShell (Permanent):
# [System.Environment]::SetEnvironmentVariable('NEWSAPI_KEY', 'your_key_here', 'User')

# Windows Command Prompt:
# set NEWSAPI_KEY=your_key_here

# Linux/Mac:
# export NEWSAPI_KEY=your_key_here

# Or create a .env file in backend folder with:
# NEWSAPI_KEY=your_key_here
# FINNHUB_API_KEY=your_key_here

# =============================================================================
# QUICK START - GET NEWSAPI KEY IN 2 MINUTES
# =============================================================================
# 1. Visit: https://newsapi.org/register
# 2. Enter your email
# 3. Check email for API key
# 4. Run in PowerShell:
#    $env:NEWSAPI_KEY = "paste_your_key_here"
# 5. Restart backend server
# 6. Test with: python test_newsapi.py
