"""
Real-Time Verification Service
Verifies financial claims, crypto prices, and source credibility
"""
import re
import requests
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class VerificationService:
    def __init__(self):
        self.coingecko_base_url = "https://api.coingecko.com/api/v3"
        self.request_headers = {
            'User-Agent': 'FakeNewsDetection/1.0',
            'Accept': 'application/json',
        }
        
        # NewsAPI configuration
        self.newsapi_key = os.getenv('NEWSAPI_KEY', None)  # Get from environment
        self.newsapi_base_url = "https://newsapi.org/v2"
        
        # Free API endpoints (no key required)
        self.yahoo_finance_base = "https://query1.finance.yahoo.com/v8/finance/chart"
        self.open_weather_base = "https://api.openweathermap.org/data/2.5/weather"
        self.open_weather_key = None  # Set from environment if available
        
        # Stock indices symbols
        self.stock_indices = {
            'dow': '^DJI',
            'dow jones': '^DJI',
            'djia': '^DJI',
            's&p 500': '^GSPC',
            's&p': '^GSPC',
            'nasdaq': '^IXIC',
            'nifty': '^NSEI',
            'sensex': '^BSESN',
            'nifty 50': '^NSEI'
        }
        
        # Known crypto symbols
        self.crypto_symbols = {
            'bitcoin': 'btc',
            'btc': 'btc',
            'ethereum': 'eth',
            'eth': 'eth',
            'ripple': 'xrp',
            'xrp': 'xrp',
            'dogecoin': 'doge',
            'doge': 'doge',
            'cardano': 'ada',
            'ada': 'ada',
            'solana': 'sol',
            'sol': 'sol'
        }
        
        # Trusted news sources (Major international and Indian sources)
        self.trusted_sources = [
            # International
            'bbc.com', 'bbc.co.uk', 'reuters.com', 'apnews.com', 'ap.org',
            'theguardian.com', 'nytimes.com', 'washingtonpost.com', 'wsj.com', 
            'bloomberg.com', 'cnn.com', 'npr.org', 'aljazeera.com', 
            'economist.com', 'ft.com', 'time.com', 'forbes.com', 'politico.com',
            # Indian Major News Networks
            'thehindu.com', 'hindustantimes.com', 'indianexpress.com',
            'timesofindia.indiatimes.com', 'indiatoday.in', 'dnaindia.com',
            'news18.com', 'news18.kannada.com', 'zeenews.india.com', 'ndtv.com',
            'indianews.com', 'thequint.com', 'scroll.in', 'firstpost.com',
            'livemint.com', 'business-standard.com', 'deccanherald.com',
            'tribuneindia.com', 'theweek.in', 'outlookindia.com',
            # Regional Indian News
            'news18.telugu.com', 'news18.tamil.com', 'news18.malayalam.com',
            'asianetnews.com', 'mathrubhumi.com', 'manoramaonline.com',
            'eenadu.net', 'sakshi.com', 'andhrajyothy.com', 'amarujala.com',
            'dainikbhaskar.com', 'jagran.com', 'loksatta.com', 'esakal.com'
        ]
        
        # Satirical/Parody news sites (intentionally fake for humor)
        self.satirical_sources = [
            'theonion.com', 'babylonbee.com', 'clickhole.com', 'reductress.com',
            'thehardtimes.net', 'waterfordwhispersnews.com', 'thedailymash.co.uk',
            'newsthump.com', 'thespoof.com', 'satirewire.com', 'fakingnews.com',
            'borowitzreport.com', 'newsbiscuit.com', 'thecivilian.co.nz',
            'thebetoota.com.au', 'rochdaleonline.co.uk'
        ]
        
        # Known fake/unreliable sources
        self.unreliable_sources = [
            'beforeitsnews.com', 'naturalnews.com', 'infowars.com',
            'worldnewsdailyreport.com', 'empirenews.net', '8shit.net',
            'huzlers.com', 'nationalreport.net', 'newslo.com'
        ]
        
        # Federal Reserve interest rate ranges (for verification)
        self.interest_rate_ranges = {
            'federal_reserve': (0.0, 10.0),  # Historical range
            'typical_change': 0.25,  # Typical change is 0.25%
        }
        
        # Financial statistics patterns
        self.financial_patterns = {
            'stock_index': r'(dow jones|djia|s&p 500|nasdaq|nifty|sensex)\s+(?:is|at|trading|reached)?\s*([0-9,]+(?:\.[0-9]+)?)',
            'unemployment': r'unemployment\s+(?:rate|at)?\s*([0-9.]+)%',
            'inflation': r'inflation\s+(?:rate|at)?\s*([0-9.]+)%',
            'gdp_growth': r'gdp\s+(?:growth|rate)?\s*([0-9.]+)%',
            'interest_rate': r'interest rate\s+(?:is|at|to|of)?\s*([0-9.]+)%'
        }
    
    def verify_claims(self, text: str, claim_type: str = 'auto') -> Dict:
        """
        Verify claims in the text (crypto prices, financial stats, interest rates)
        
        Args:
            text: Text containing claims to verify
            claim_type: Type of claim ('crypto_price', 'financial_stat', 'interest_rate', 'auto')
            
        Returns:
            Dict with verification results
        """
        results = {
            'verified': False,
            'claims_found': [],
            'verifications': [],
            'inconsistencies': [],
            'types_checked': [],
        }
        
        try:
            # Extract and verify crypto price claims
            crypto_claims = self._extract_crypto_claims(text)
            
            if crypto_claims:
                results['types_checked'].append('crypto_price')
                crypto_prices = self._fetch_crypto_prices(crypto_claims)
                for claim in crypto_claims:
                    verification = self._verify_crypto_price(claim, crypto_prices)
                    results['claims_found'].append({
                        'type': 'crypto_price',
                        'claim': claim
                    })
                    results['verifications'].append(verification)
                    
                    if verification.get('matches') is False:
                        results['inconsistencies'].append({
                            'type': 'crypto_price',
                            'claim': claim,
                            'issue': verification['message']
                        })
            
            # Extract and verify financial statistics
            financial_claims = self._extract_financial_claims(text)
            
            if financial_claims:
                results['types_checked'].append('financial_statistics')
                for claim in financial_claims:
                    verification = self._verify_financial_claim(claim)
                    results['claims_found'].append({
                        'type': 'financial_statistic',
                        'claim': claim
                    })
                    results['verifications'].append(verification)
                    
                    if verification.get('suspicious'):
                        results['inconsistencies'].append({
                            'type': 'financial_statistic',
                            'claim': claim,
                            'issue': verification['message']
                        })
            
            # Extract and verify interest rate claims
            interest_claims = self._extract_interest_rate_claims(text)
            
            if interest_claims:
                results['types_checked'].append('interest_rate')
                for claim in interest_claims:
                    verification = self._verify_interest_rate(claim)
                    results['claims_found'].append({
                        'type': 'interest_rate',
                        'claim': claim
                    })
                    results['verifications'].append(verification)
                    
                    if verification.get('suspicious'):
                        results['inconsistencies'].append({
                            'type': 'interest_rate',
                            'claim': claim,
                            'issue': verification['message']
                        })
            
            # Verify stock market index claims (Yahoo Finance API)
            stock_result = self.verify_stock_index(text)
            if stock_result.get('verified') or stock_result.get('claims_found'):
                results['types_checked'].append('stock_market')
                results['claims_found'].extend([
                    {'type': 'stock_index', 'claim': claim} 
                    for claim in stock_result.get('claims_found', [])
                ])
                results['verifications'].extend(stock_result.get('verifications', []))
                results['inconsistencies'].extend(stock_result.get('inconsistencies', []))
            
            # Verify weather claims
            weather_result = self.verify_weather_claim(text)
            if weather_result.get('suspicious_claims'):
                results['types_checked'].append('weather')
                for claim in weather_result['suspicious_claims']:
                    results['claims_found'].append({
                        'type': 'weather',
                        'claim': claim
                    })
                    results['inconsistencies'].append({
                        'type': 'weather',
                        'claim': claim,
                        'issue': 'Suspicious weather claim'
                    })
            
            # Check if any claims were verified
            results['verified'] = len(results['claims_found']) > 0
            
            return results
            
        except Exception as e:
            logger.error(f"Error verifying claims: {str(e)}")
            return {
                'verified': False,
                'error': str(e)
            }
    
    def _extract_crypto_claims(self, text: str) -> List[Dict]:
        """Extract cryptocurrency price claims from text"""
        claims = []
        
        # Multiple patterns to match various ways crypto prices are mentioned
        # All patterns now handle optional $ and commas in numbers
        patterns = [
            # Standard format with "is/are": "Bitcoin is $50,000" or "Bitcoin is trading at $90000"
            r'(bitcoin|btc|ethereum|eth|ripple|xrp|dogecoin|doge|cardano|ada|solana|sol)\s+(?:is|are)\s+(?:trading\s+)?(?:at|priced\s+at|worth)?\s*\$?\s*([0-9,]+(?:\.[0-9]+)?)',
            # Action format: "BTC at 50000" or "Bitcoin reached $5000"
            r'(bitcoin|btc|ethereum|eth|ripple|xrp|dogecoin|doge|cardano|ada|solana|sol)\s+(?:at|reached|hit)\s*\$?\s*([0-9,]+(?:\.[0-9]+)?)',
            # With action verbs: "surged to", "dropped to", "rose to", "fell to", "climbed to"
            r'(bitcoin|btc|ethereum|eth|ripple|xrp|dogecoin|doge|cardano|ada|solana|sol)\s+(?:has\s+)?(?:surged?|surging|dropped?|dropping|fell|falling|rose|rising|climbed?|climbing)\s+(?:to|at)\s*\$?\s*([0-9,]+(?:\.[0-9]+)?)',
            # Price first: "$50,000 for Bitcoin"
            r'\$\s*([0-9,]+(?:\.[0-9]+)?)\s+(?:for|per)\s*(bitcoin|btc|ethereum|eth|ripple|xrp|dogecoin|doge|cardano|ada|solana|sol)',
            # With "price": "Bitcoin price surging to $150,000" or "Bitcoin's price at $50k"
            r'(bitcoin|btc|ethereum|eth|ripple|xrp|dogecoin|doge|cardano|ada|solana|sol)(?:\'s)?\s+price\s+(?:has\s+)?(?:surged?|surging|risen|rising|dropped?|dropping|fallen|falling|reached?|reaching|hit|hitting|is|at)?\s*(?:to|at)?\s*\$?\s*([0-9,]+(?:\.[0-9]+)?)',
            # Direct mention: "Bitcoin $50,000"
            r'(bitcoin|btc|ethereum|eth|ripple|xrp|dogecoin|doge|cardano|ada|solana|sol)\s+\$\s*([0-9,]+(?:\.[0-9]+)?)',
            # Cryptocurrency's price format
            r'(cryptocurrency|crypto)(?:\'s)?\s+price\s+(?:surging?|rising?|reaching?)\s+(?:to|at)\s*\$?\s*([0-9,]+(?:\.[0-9]+)?)'
        ]
        
        text_lower = text.lower()
        last_mentioned_crypto = None  # Track context for "cryptocurrency" references
        
        for pattern in patterns:
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                if len(match.groups()) >= 2:
                    # Determine which group is crypto and which is price
                    group1 = match.group(1)
                    group2 = match.group(2)
                    
                    # Handle "cryptocurrency" generic reference
                    if group1 and group1.lower() in ['cryptocurrency', 'crypto']:
                        # Use last mentioned crypto or default to bitcoin
                        crypto = last_mentioned_crypto if last_mentioned_crypto else 'bitcoin'
                        price_str = group2
                    # Check if group1 is a specific crypto name/symbol
                    elif group1 and group1.lower() in self.crypto_symbols:
                        crypto = group1
                        price_str = group2
                        last_mentioned_crypto = group1  # Track for context
                    else:
                        crypto = group2
                        price_str = group1
                        if group2 and group2.lower() in self.crypto_symbols:
                            last_mentioned_crypto = group2
                    
                    try:
                        price = float(price_str.replace(',', ''))
                        
                        claims.append({
                            'cryptocurrency': crypto.lower(),
                            'claimed_price': price,
                            'original_text': match.group(0)
                        })
                    except (ValueError, AttributeError):
                        continue
        
        return claims
    
    def _fetch_crypto_prices(self, claims: List[Dict]) -> Dict:
        """Fetch all referenced crypto prices in one CoinGecko request."""
        crypto_map = {
            'btc': 'bitcoin',
            'eth': 'ethereum',
            'xrp': 'ripple',
            'doge': 'dogecoin',
            'ada': 'cardano',
            'sol': 'solana'
        }

        crypto_ids = []
        for claim in claims:
            crypto_id = crypto_map.get(claim.get('cryptocurrency'), claim.get('cryptocurrency'))
            if crypto_id and crypto_id not in crypto_ids:
                crypto_ids.append(crypto_id)

        if not crypto_ids:
            return {'prices': {}, 'error': 'No cryptocurrencies to verify'}

        try:
            url = f"{self.coingecko_base_url}/simple/price"
            params = {
                'ids': ','.join(crypto_ids),
                'vs_currencies': 'usd'
            }

            response = requests.get(url, params=params, headers=self.request_headers, timeout=5)

            if response.status_code == 200:
                return {'prices': response.json(), 'error': None}

            error_message = f"CoinGecko returned HTTP {response.status_code}"
            try:
                payload = response.json()
                status = payload.get('status', {})
                api_message = status.get('error_message')
                if api_message:
                    error_message = api_message
            except Exception:
                pass

            logger.warning(f"Crypto price lookup failed: {error_message}")
            return {'prices': {}, 'error': error_message}

        except Exception as e:
            logger.error(f"Error fetching crypto prices: {str(e)}")
            return {'prices': {}, 'error': str(e)}

    def _verify_crypto_price(self, claim: Dict, crypto_price_data: Optional[Dict] = None) -> Dict:
        """Verify cryptocurrency price against CoinGecko API."""
        try:
            crypto_id = claim['cryptocurrency']
            
            # Map symbol to CoinGecko ID
            crypto_map = {
                'btc': 'bitcoin',
                'eth': 'ethereum',
                'xrp': 'ripple',
                'doge': 'dogecoin',
                'ada': 'cardano',
                'sol': 'solana'
            }
            
            if crypto_id in crypto_map:
                crypto_id = crypto_map[crypto_id]

            price_payload = crypto_price_data or self._fetch_crypto_prices([claim])
            data = price_payload.get('prices', {}) if isinstance(price_payload, dict) else {}

            if crypto_id in data and isinstance(data[crypto_id], dict) and 'usd' in data[crypto_id]:
                actual_price = data[crypto_id]['usd']
                claimed_price = claim['claimed_price']

                # Calculate percentage difference
                diff_pct = abs((claimed_price - actual_price) / actual_price * 100)

                # Allow 10% tolerance
                matches = diff_pct <= 10

                return {
                    'cryptocurrency': crypto_id,
                    'claimed_price': claimed_price,
                    'actual_price': actual_price,
                    'difference_pct': round(diff_pct, 2),
                    'matches': matches,
                    'message': 'Price matches current market data' if matches else f'Price differs by {diff_pct:.1f}%',
                    'timestamp': datetime.now().isoformat()
                }

            return {
                'cryptocurrency': crypto_id,
                'matches': None,
                'message': 'Price verification unavailable',
                'error': (price_payload or {}).get('error', 'API request failed')
            }
            
        except Exception as e:
            logger.error(f"Error verifying crypto price: {str(e)}")
            return {
                'cryptocurrency': claim.get('cryptocurrency', 'unknown'),
                'matches': None,
                'message': 'Verification failed',
                'error': str(e)
            }
    
    def _extract_financial_claims(self, text: str) -> List[Dict]:
        """Extract financial statistics claims from text"""
        claims = []
        text_lower = text.lower()
        
        for claim_type, pattern in self.financial_patterns.items():
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                claim_data = {
                    'type': claim_type,
                    'value': match.group(1) if len(match.groups()) == 1 else match.group(2),
                    'original_text': match.group(0)
                }
                
                if claim_type == 'stock_index':
                    claim_data['index'] = match.group(1)
                    claim_data['value'] = match.group(2)
                
                claims.append(claim_data)
        
        return claims
    
    def _verify_financial_claim(self, claim: Dict) -> Dict:
        """Verify financial statistics claim for reasonableness"""
        claim_type = claim['type']
        value_str = str(claim['value']).replace(',', '')
        
        try:
            value = float(value_str)
        except ValueError:
            return {
                'type': claim_type,
                'suspicious': True,
                'message': 'Invalid numeric value',
                'claim': claim
            }
        
        # Check for suspicious values based on type
        suspicious = False
        message = 'Value appears reasonable'
        
        if claim_type == 'unemployment':
            # Unemployment rates typically 0-25%
            if value < 0 or value > 50:
                suspicious = True
                message = f'Unemployment rate of {value}% is highly unusual (typical range: 0-25%)'
            elif value > 25:
                suspicious = True
                message = f'Unemployment rate of {value}% is extremely high (warrants verification)'
        
        elif claim_type == 'inflation':
            # Inflation typically -5% to 20% in most economies
            if value < -10 or value > 100:
                suspicious = True
                message = f'Inflation rate of {value}% is extreme (typical range: -5% to 20%)'
            elif value > 30:
                suspicious = True
                message = f'Inflation rate of {value}% indicates hyperinflation (verify carefully)'
        
        elif claim_type == 'gdp_growth':
            # GDP growth typically -10% to 15%
            if value < -20 or value > 30:
                suspicious = True
                message = f'GDP growth of {value}% is highly unusual (typical range: -10% to 15%)'
        
        elif claim_type == 'stock_index':
            # Stock indexes can vary widely, just check for negative values
            if value < 0:
                suspicious = True
                message = 'Stock index with negative value is impossible'
        
        return {
            'type': claim_type,
            'value': value,
            'suspicious': suspicious,
            'message': message,
            'claim': claim
        }
    
    def _extract_interest_rate_claims(self, text: str) -> List[Dict]:
        """Extract interest rate claims from text"""
        claims = []
        text_lower = text.lower()
        
        pattern = self.financial_patterns['interest_rate']
        matches = re.finditer(pattern, text_lower, re.IGNORECASE)
        
        for match in matches:
            claims.append({
                'rate': match.group(1),
                'original_text': match.group(0)
            })
        
        return claims
    
    def _verify_interest_rate(self, claim: Dict) -> Dict:
        """Verify interest rate claim for reasonableness"""
        try:
            rate = float(claim['rate'])
        except ValueError:
            return {
                'suspicious': True,
                'message': 'Invalid interest rate value',
                'claim': claim
            }
        
        suspicious = False
        message = 'Interest rate appears reasonable'
        
        # Federal Reserve rates typically 0-10%
        min_rate, max_rate = self.interest_rate_ranges['federal_reserve']
        
        if rate < 0:
            suspicious = True
            message = 'Negative interest rates are rare (verify carefully)'
        elif rate < min_rate:
            suspicious = False
            message = f'Interest rate of {rate}% is low but possible'
        elif rate > max_rate:
            suspicious = True
            message = f'Interest rate of {rate}% is unusually high (typical max: {max_rate}%)'
        elif rate > 20:
            suspicious = True
            message = f'Interest rate of {rate}% is extremely high (verify immediately)'
        
        return {
            'rate': rate,
            'suspicious': suspicious,
            'message': message,
            'typical_range': self.interest_rate_ranges['federal_reserve'],
            'claim': claim
        }
    
    def check_source_credibility(self, url: str) -> Dict:
        """
        Check credibility of a news source based on domain
        
        Args:
            url: Full URL or domain to check
            
        Returns:
            Dict with credibility assessment
        """
        try:
            # Extract domain from URL
            domain = url.lower()
            if '://' in domain:
                domain = domain.split('://')[1]
            domain = domain.split('/')[0]
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # Check against known lists (satirical check FIRST to prevent override)
            if any(satirical in domain for satirical in self.satirical_sources):
                return {
                    'domain': domain,
                    'credibility': 'Satirical',
                    'credibility_score': 10,
                    'status': 'satire',
                    'message': 'Source is a satirical/parody news site (intentionally fake for humor)',
                    'color': 'orange'
                }
            
            if any(trusted in domain for trusted in self.trusted_sources):
                return {
                    'domain': domain,
                    'credibility': 'High',
                    'credibility_score': 90,
                    'status': 'trusted',
                    'message': 'Source is from a trusted news organization',
                    'color': 'green'
                }
            
            if any(unreliable in domain for unreliable in self.unreliable_sources):
                return {
                    'domain': domain,
                    'credibility': 'Low',
                    'credibility_score': 20,
                    'status': 'unreliable',
                    'message': 'Source is known for publishing unreliable content',
                    'color': 'red'
                }
            
            # Unknown source
            return {
                'domain': domain,
                'credibility': 'Unknown',
                'credibility_score': 50,
                'status': 'unknown',
                'message': 'Source credibility cannot be determined. Verify carefully.',
                'color': 'yellow'
            }
            
        except Exception as e:
            logger.error(f"Error checking source credibility: {str(e)}")
            return {
                'error': str(e),
                'credibility': 'Unknown',
                'credibility_score': 50
            }
    
    def verify_stock_index(self, text: str) -> Dict:
        """
        Verify stock market index claims against real-time data
        
        Args:
            text: Text containing stock index claims
            
        Returns:
            Dict with verification results
        """
        results = {
            'verified': False,
            'claims_found': [],
            'verifications': [],
            'inconsistencies': []
        }
        
        try:
            # Extract stock index mentions
            text_lower = text.lower()
            
            for index_name, symbol in self.stock_indices.items():
                if index_name in text_lower:
                    # Extract claimed value - handle various formats
                    patterns = [
                        # "Dow Jones crashed to 15000" or "Dow Jones at 15000"
                        rf'{re.escape(index_name)}\s+(?:crashed?|plunged?|fell|dropped?|rose|climbed?|surged?|reached?|hit)\s+(?:to|at)?\s*([0-9,]+(?:\.[0-9]+)?)',
                        # "Dow Jones is 15000" or "Dow Jones at 15000"
                        rf'{re.escape(index_name)}\s+(?:is|are|at|trading)\s+(?:at)?\s*([0-9,]+(?:\.[0-9]+)?)',
                        # Simple: "Dow Jones 15000"
                        rf'{re.escape(index_name)}\s+([0-9,]+(?:\.[0-9]+)?)',
                    ]
                    
                    match = None
                    for pattern in patterns:
                        match = re.search(pattern, text_lower, re.IGNORECASE)
                        if match:
                            break
                    
                    if match:
                        claimed_value_str = match.group(1).replace(',', '')
                        try:
                            claimed_value = float(claimed_value_str)
                            
                            # Get actual value from Yahoo Finance
                            actual_value = self._get_stock_index_value(symbol)
                            
                            if actual_value:
                                diff_pct = abs((claimed_value - actual_value) / actual_value * 100)
                                matches = diff_pct <= 5  # 5% tolerance
                                
                                verification = {
                                    'index': index_name.upper(),
                                    'symbol': symbol,
                                    'claimed_value': claimed_value,
                                    'actual_value': actual_value,
                                    'difference_pct': round(diff_pct, 2),
                                    'matches': matches,
                                    'message': f'Index value matches' if matches else f'Index value differs by {diff_pct:.1f}%',
                                    'timestamp': datetime.now().isoformat()
                                }
                                
                                results['claims_found'].append(index_name.upper())
                                results['verifications'].append(verification)
                                
                                if not matches:
                                    results['inconsistencies'].append(verification)
                                    results['verified'] = True
                        
                        except ValueError:
                            logger.warning(f"Could not parse stock value: {claimed_value_str}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error verifying stock index: {str(e)}")
            return {'error': str(e), 'verified': False}
    
    def _get_stock_index_value(self, symbol: str) -> Optional[float]:
        """Get current stock index value from Yahoo Finance"""
        try:
            url = f"{self.yahoo_finance_base}/{symbol}"
            params = {'interval': '1d', 'range': '1d'}
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract current price
                if 'chart' in data and 'result' in data['chart']:
                    result = data['chart']['result'][0]
                    if 'meta' in result and 'regularMarketPrice' in result['meta']:
                        return result['meta']['regularMarketPrice']
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching stock data: {str(e)}")
            return None
    
    def verify_weather_claim(self, text: str) -> Dict:
        """
        Verify weather-related claims (temperature extremes)
        
        Args:
            text: Text containing weather claims
            
        Returns:
            Dict with verification results
        """
        results = {
            'verified': False,
            'suspicious_claims': [],
            'warnings': []
        }
        
        try:
            text_lower = text.lower()
            
            # Check for impossible temperature claims
            temp_patterns = [
                (r'temperature.{0,30}(reached|hit|recorded).{0,20}([0-9]{3,})\s*(?:degrees|°)', 'impossibly_high'),
                (r'temperature.{0,30}(dropped|fell|plunged).{0,20}-([0-9]{3,})\s*(?:degrees|°)', 'impossibly_low'),
                (r'(hottest|coldest|warmest)\s+(?:day|temperature)\s+(?:ever|recorded|in history)', 'unverifiable_extreme'),
            ]
            
            for pattern, claim_type in temp_patterns:
                matches = re.finditer(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    results['suspicious_claims'].append({
                        'type': claim_type,
                        'text': match.group(0),
                        'reason': 'Extreme temperature claim requires verification'
                    })
                    results['verified'] = True
            
            # Check for weather disaster exaggerations
            disaster_patterns = [
                r'(hurricane|tornado|cyclone).{0,30}category\s+([6-9]|10)',  # Category 5 is max
                r'earthquake.{0,30}(10|11|12|13|14|15)\.0',  # Magnitude >10 extremely rare
                r'tsunami.{0,30}([5-9][0-9]{2}|[1-9][0-9]{3})\s*(?:meters|feet|m|ft)',  # Unrealistic height
            ]
            
            for pattern in disaster_patterns:
                matches = re.finditer(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    results['warnings'].append({
                        'type': 'disaster_exaggeration',
                        'text': match.group(0),
                        'reason': 'Weather disaster scale appears exaggerated'
                    })
                    results['verified'] = True
            
            return results
            
        except Exception as e:
            logger.error(f"Error verifying weather claim: {str(e)}")
            return {'error': str(e), 'verified': False}
    
    def cross_check_news_sources(self, headline: str, url: str = None) -> Dict:
        """
        Check if a news headline appears in multiple trusted sources using NewsAPI
        
        Args:
            headline: News headline to verify
            url: Optional source URL
            
        Returns:
            Dict with cross-reference results
        """
        results = {
            'headline': headline,
            'source_url': url,
            'found_in_trusted_sources': False,
            'similar_headlines': [],
            'trusted_sources_count': 0,
            'total_articles_found': 0,
            'recommendation': '',
            'newsapi_enabled': self.newsapi_key is not None
        }
        
        try:
            # Check source credibility first
            if url:
                credibility = self.check_source_credibility(url)
                results['source_credibility'] = credibility
                
                if credibility['status'] == 'unreliable':
                    results['recommendation'] = 'Source is known for unreliable content - verify with trusted sources'
                    return results
            
            # Basic heuristics (always run)
            sensational_words = ['shocking', 'unbelievable', 'miracle', 'secret', 'they dont want you to know', 
                               'doctors hate', 'one weird trick', 'you won\'t believe']
            has_sensational = any(word in headline.lower() for word in sensational_words)
            
            if has_sensational:
                results['has_sensational_language'] = True
                results['recommendation'] = 'Headline contains sensational language - verify with multiple trusted sources'
            
            # Try NewsAPI if key is available
            if self.newsapi_key:
                newsapi_result = self._search_newsapi(headline)
                
                if newsapi_result['success']:
                    results['total_articles_found'] = newsapi_result['total_results']
                    results['similar_headlines'] = newsapi_result['articles'][:5]  # Top 5
                    
                    # Count how many trusted sources covered it
                    trusted_count = sum(
                        1 for article in newsapi_result['articles']
                        if any(trusted in article['source'].lower() 
                              for trusted in ['bbc', 'reuters', 'ap news', 'guardian', 'nytimes', 'wsj', 'bloomberg'])
                    )
                    
                    results['trusted_sources_count'] = trusted_count
                    results['found_in_trusted_sources'] = trusted_count >= 2
                    
                    # Generate recommendation
                    if trusted_count >= 3:
                        results['recommendation'] = f'✅ Story confirmed by {trusted_count} trusted sources - likely credible'
                    elif trusted_count >= 1:
                        results['recommendation'] = f'⚠️ Found in {trusted_count} trusted source(s) - verify with additional sources'
                    elif results['total_articles_found'] > 0:
                        results['recommendation'] = '❌ Not found in major trusted sources - treat with skepticism'
                    else:
                        results['recommendation'] = '❌ No matching articles found - potentially fabricated or breaking news'
                else:
                    results['recommendation'] = 'Unable to verify via NewsAPI - check manually with trusted sources'
                    results['newsapi_error'] = newsapi_result.get('error')
            else:
                # Fallback without API key
                results['recommendation'] = '⚠️ NewsAPI not configured - add API key to verify headlines across 80k+ sources'
            
            return results
            
        except Exception as e:
            logger.error(f"Error cross-checking news: {str(e)}")
            return {'error': str(e), 'headline': headline}
    
    def _search_newsapi(self, query: str) -> Dict:
        """
        Search NewsAPI for articles matching the query
        
        Args:
            query: Search query (headline or keywords)
            
        Returns:
            Dict with search results
        """
        try:
            # Search everything endpoint (last 30 days)
            url = f"{self.newsapi_base_url}/everything"
            
            # Use last 7 days for faster results
            from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            
            params = {
                'q': query[:500],  # Limit query length
                'apiKey': self.newsapi_key,
                'language': 'en',
                'sortBy': 'relevancy',
                'pageSize': 20,  # Get top 20 results
                'from': from_date
            }
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                articles = []
                for article in data.get('articles', []):
                    articles.append({
                        'title': article.get('title', ''),
                        'source': article.get('source', {}).get('name', ''),
                        'url': article.get('url', ''),
                        'published_at': article.get('publishedAt', '')
                    })
                
                return {
                    'success': True,
                    'total_results': data.get('totalResults', 0),
                    'articles': articles
                }
            elif response.status_code == 401:
                logger.error("NewsAPI: Invalid API key")
                return {'success': False, 'error': 'Invalid API key'}
            elif response.status_code == 429:
                logger.error("NewsAPI: Rate limit exceeded")
                return {'success': False, 'error': 'Rate limit exceeded (max 100 requests/day on free tier)'}
            else:
                logger.error(f"NewsAPI error: {response.status_code}")
                return {'success': False, 'error': f'API error: {response.status_code}'}
                
        except Exception as e:
            logger.error(f"Error searching NewsAPI: {str(e)}")
            return {'success': False, 'error': str(e)}


# Singleton instance
_verification_service = None

def get_verification_service() -> VerificationService:
    """Get singleton instance of VerificationService"""
    global _verification_service
    if _verification_service is None:
        _verification_service = VerificationService()
    return _verification_service
