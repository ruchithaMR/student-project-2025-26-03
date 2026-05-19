"""
FREE Financial & News APIs Available

══════════════════════════════════════════════════════════════════════
1. ✅ WORKING: CoinGecko API (Crypto)
══════════════════════════════════════════════════════════════════════
   - URL: https://api.coingecko.com/api/v3
   - Free tier: unlimited requests
   - No API key required
   -Status: ✅ INTEGRATED AND WORKING

══════════════════════════════════════════════════════════════════════
2. ❌ RATE LIMITED: Yahoo Finance (Stocks)
══════════════════════════════════════════════════════════════════════
   - Issue: Returns 429 (Too Many Requests)
   - Yahoo blocks automated requests
   - Alternatives below:

══════════════════════════════════════════════════════════════════════
3. 🆕 Alpha Vantage API (Stocks, Forex, Crypto)
══════════════════════════════════════════════════════════════════════
   - URL: https://www.alphavantage.co/
   - Free tier: 25 requests/day, 5 req/minute
   - Requires free API key (sign up)
   - Coverage: US stocks (Dow, S&P, NASDAQ), Forex, Crypto
   - Example: https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=YOUR_KEY

══════════════════════════════════════════════════════════════════════
4. 🆕 Twelve Data API (Stocks, Forex, Crypto)
══════════════════════════════════════════════════════════════════════
   - URL: https://twelvedata.com/
   - Free tier: 800 requests/day
   - Requires free API key
   - Better rate limits than Alpha Vantage
   - Coverage: Global stocks, cryptos

══════════════════════════════════════════════════════════════════════
5. 🆕 Finnhub API (Stocks, Forex, News)
══════════════════════════════════════════════════════════════════════
   - URL: https://finnhub.io/
   - Free tier: 60 requests/minute
   - Requires free API key
   - Also provides financial NEWS verification
   - Example: https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_KEY

══════════════════════════════════════════════════════════════════════
6. 🆕 Polygon.io API (Stocks, Forex, Crypto)
══════════════════════════════════════════════════════════════════════
   - URL: https://polygon.io/
   - Free tier: 5 requests/minute
   - Requires free API key
   - Real-time stock data
   - Very reliable

══════════════════════════════════════════════════════════════════════
7. 🆕 NewsAPI (News Verification)
══════════════════════════════════════════════════════════════════════
   - URL: https://newsapi.org/
   - Free tier: 100 requests/day
   - Requires free API key
   - Cross-check headlines across 80k+ sources
   - Example: https://newsapi.org/v2/everything?q=bitcoin&apikey=YOUR_KEY

══════════════════════════════════════════════════════════════════════
8. 🆕 MediaStack API (News)
══════════════════════════════════════════════════════════════════════
   - URL: https://mediastack.com/
   - Free tier: 500 requests/month
   - Requires free API key
   - Real-time news from 7500+ sources

══════════════════════════════════════════════════════════════════════
9. 🔧 Alternative: Web Scraping (No API key)
══════════════════════════════════════════════════════════════════════
   - Scrape Google Finance, MarketWatch, Investing.com
   - No API key needed
   - Risk: Can be blocked, less reliable
   - Legal considerations

══════════════════════════════════════════════════════════════════════
RECOMMENDATION
══════════════════════════════════════════════════════════════════════

For Stock Market:
   → Use Finnhub (60 req/min) or Twelve Data (800 req/day)
   → Both are free and reliable

For News Verification:
   → Use NewsAPI (100 req/day)
   → Can cross-check headlines across trusted sources

Current Working:
   ✅ CoinGecko for crypto (unlimited, working great!)
   ❌ Yahoo Finance (rate limited)

══════════════════════════════════════════════════════════════════════
"""

print(__doc__)
