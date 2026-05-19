"""
URL Scraping Utilities
Scrapes and extracts article content from URLs
"""
import requests
from bs4 import BeautifulSoup
import logging
from datetime import datetime
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class URLScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        self.timeout = 10
    
    def scrape(self, url: str) -> Dict:
        """
        Scrape article content from URL
        
        Args:
            url: Article URL to scrape
            
        Returns:
            Dict with scraped content and metadata
        """
        try:
            # Fetch page
            response = requests.get(url, headers=self.headers, timeout=self.timeout)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title = self._extract_title(soup)
            
            # Extract article text
            article_text = self._extract_article_text(soup)
            
            if not article_text:
                return {
                    'success': False,
                    'error': 'No article content found'
                }
            
            # Extract metadata
            author = self._extract_author(soup)
            publish_date = self._extract_publish_date(soup)
            source = self._extract_source(url)
            
            return {
                'success': True,
                'text': article_text,
                'title': title,
                'author': author,
                'publish_date': publish_date,
                'source': source,
                'url': url,
                'word_count': len(article_text.split()),
                'scraped_at': datetime.now().isoformat()
            }
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout scraping URL: {url}")
            return {
                'success': False,
                'error': 'Request timed out'
            }
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping URL {url}: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to fetch URL: {str(e)}'
            }
        
        except Exception as e:
            logger.error(f"Unexpected error scraping URL {url}: {str(e)}")
            return {
                'success': False,
                'error': f'Scraping failed: {str(e)}'
            }
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract article title"""
        # Try different common title tags
        title_selectors = [
            soup.find('h1'),
            soup.find('title'),
            soup.find('meta', property='og:title'),
            soup.find('meta', attrs={'name': 'title'})
        ]
        
        for selector in title_selectors:
            if selector:
                if selector.name == 'meta':
                    title = selector.get('content', '')
                else:
                    title = selector.get_text(strip=True)
                
                if title:
                    return title
        
        return ''
    
    def _extract_article_text(self, soup: BeautifulSoup) -> str:
        """Extract main article text"""
        # Remove script and style elements
        for script in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
            script.decompose()
        
        # Try common article containers
        article = None
        article_selectors = [
            soup.find('article'),
            soup.find('div', class_=lambda x: x and 'article' in x.lower()),
            soup.find('div', class_=lambda x: x and 'content' in x.lower()),
            soup.find('div', class_=lambda x: x and 'story' in x.lower()),
            soup.find('div', id=lambda x: x and 'article' in x.lower()),
        ]
        
        for selector in article_selectors:
            if selector:
                article = selector
                break
        
        # If no article container found, use body
        if not article:
            article = soup.find('body')
        
        # Extract text from paragraphs
        if article:
            paragraphs = article.find_all('p')
            text = ' '.join([p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)])
            
            # Clean text
            text = ' '.join(text.split())  # Remove extra whitespace
            
            return text
        
        return ''
    
    def _extract_author(self, soup: BeautifulSoup) -> str:
        """Extract article author"""
        author_selectors = [
            soup.find('meta', attrs={'name': 'author'}),
            soup.find('meta', property='article:author'),
            soup.find('span', class_=lambda x: x and 'author' in x.lower()),
            soup.find('a', class_=lambda x: x and 'author' in x.lower()),
            soup.find('div', class_=lambda x: x and 'author' in x.lower())
        ]
        
        for selector in author_selectors:
            if selector:
                if selector.name == 'meta':
                    author = selector.get('content', '')
                else:
                    author = selector.get_text(strip=True)
                
                if author:
                    return author
        
        return ''
    
    def _extract_publish_date(self, soup: BeautifulSoup) -> str:
        """Extract article publish date"""
        date_selectors = [
            soup.find('meta', property='article:published_time'),
            soup.find('meta', attrs={'name': 'publish_date'}),
            soup.find('meta', attrs={'name': 'date'}),
            soup.find('time'),
            soup.find('span', class_=lambda x: x and 'date' in x.lower())
        ]
        
        for selector in date_selectors:
            if selector:
                if selector.name == 'meta':
                    date = selector.get('content', '')
                elif selector.name == 'time':
                    date = selector.get('datetime', '') or selector.get_text(strip=True)
                else:
                    date = selector.get_text(strip=True)
                
                if date:
                    return date
        
        return ''
    
    def _extract_source(self, url: str) -> str:
        """Extract source domain from URL"""
        try:
            domain = url.split('://')[1].split('/')[0]
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except:
            return ''
