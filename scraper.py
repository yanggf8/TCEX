#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
from urllib.parse import urljoin, urlparse
import time

BASE_URL = "https://mcex.mo"
OUTPUT_FILE = "mcex_scraped_data.json"

def scrape_page(url):
    """Scrape a single page and extract structure"""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        return {
            'url': url,
            'title': soup.title.string if soup.title else '',
            'nav_structure': extract_nav(soup),
            'sections': extract_sections(soup),
            'stats': extract_stats(soup),
            'links': extract_links(soup, url)
        }
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

def extract_nav(soup):
    """Extract navigation structure"""
    nav_items = []
    nav = soup.find_all(['nav', 'header'])
    for n in nav:
        links = n.find_all('a')
        for link in links:
            nav_items.append({
                'text': link.get_text(strip=True),
                'href': link.get('href', '')
            })
    return nav_items

def extract_sections(soup):
    """Extract main content sections"""
    sections = []
    for section in soup.find_all(['section', 'div'], class_=True):
        sections.append({
            'class': ' '.join(section.get('class', [])),
            'text': section.get_text(strip=True)[:200]  # First 200 chars
        })
    return sections

def extract_stats(soup):
    """Extract statistics/numbers from page"""
    stats = []
    # Look for number patterns
    text = soup.get_text()
    import re
    numbers = re.findall(r'[\d,]+\.?\d*\s*[億萬千百MOP|RMB|TWD|個]', text)
    return numbers[:20]  # Limit to 20 items

def extract_links(soup, base_url):
    """Extract all internal links"""
    links = set()
    for link in soup.find_all('a', href=True):
        href = link['href']
        full_url = urljoin(base_url, href)
        if urlparse(full_url).netloc == urlparse(base_url).netloc:
            links.add(full_url)
    return list(links)

def main():
    pages_to_scrape = [
        f"{BASE_URL}/tc",
        f"{BASE_URL}/tc/product",
        f"{BASE_URL}/tc/listing",
        f"{BASE_URL}/tc/market",
        f"{BASE_URL}/tc/service",
        f"{BASE_URL}/tc/resource",
        f"{BASE_URL}/tc/about"
    ]
    
    scraped_data = []
    
    for url in pages_to_scrape:
        print(f"Scraping {url}...")
        data = scrape_page(url)
        if data:
            scraped_data.append(data)
        time.sleep(1)  # Be respectful
    
    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(scraped_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nScraped data saved to {OUTPUT_FILE}")
    print(f"Total pages scraped: {len(scraped_data)}")

if __name__ == "__main__":
    main()
