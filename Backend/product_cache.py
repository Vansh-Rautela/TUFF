import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os

class ProductCache:
    def __init__(self, db_path='product_cache.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Products table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id TEXT UNIQUE,
                title TEXT NOT NULL,
                brand TEXT,
                price TEXT,
                thumbnail TEXT,
                link TEXT NOT NULL,
                category TEXT,
                color TEXT,
                style TEXT,
                gender TEXT,
                tags TEXT,
                source TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for faster queries
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_brand ON products(brand)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_category ON products(category)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_gender ON products(gender)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_scraped_at ON products(scraped_at)')
        
        conn.commit()
        conn.close()
    
    def add_products(self, products: List[Dict]):
        """Add or update products in the cache"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for product in products:
            product_id = product.get('id') or product.get('link')
            
            cursor.execute('''
                INSERT OR REPLACE INTO products 
                (product_id, title, brand, price, thumbnail, link, category, color, style, gender, tags, source, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                product_id,
                product.get('title', ''),
                product.get('brand', ''),
                product.get('price', ''),
                product.get('thumbnail', ''),
                product.get('link', ''),
                product.get('category', ''),
                product.get('color', ''),
                product.get('style', ''),
                product.get('gender', ''),
                json.dumps(product.get('tags', [])),
                product.get('source', ''),
                datetime.now().isoformat()
            ))
        
        conn.commit()
        conn.close()
        return len(products)
    
    def get_products(self, 
                     limit: int = 100, 
                     brands: Optional[List[str]] = None,
                     gender: Optional[str] = None,
                     category: Optional[str] = None,
                     max_age_hours: int = 24) -> List[Dict]:
        """Get products from cache"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Build query
        query = 'SELECT * FROM products WHERE scraped_at > ?'
        params = [datetime.now() - timedelta(hours=max_age_hours)]
        
        if brands:
            placeholders = ','.join('?' * len(brands))
            query += f' AND brand IN ({placeholders})'
            params.extend(brands)
        
        if gender:
            query += ' AND gender = ?'
            params.append(gender)
        
        if category:
            query += ' AND category = ?'
            params.append(category)
        
        query += ' ORDER BY scraped_at DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        
        columns = [col[0] for col in cursor.description]
        products = []
        
        for row in cursor.fetchall():
            product = dict(zip(columns, row))
            # Parse tags from JSON
            if product.get('tags'):
                try:
                    product['tags'] = json.loads(product['tags'])
                except:
                    product['tags'] = []
            products.append(product)
        
        conn.close()
        return products
    
    def get_product_count(self, max_age_hours: int = 24) -> int:
        """Get count of cached products"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT COUNT(*) FROM products 
            WHERE scraped_at > ?
        ''', (datetime.now() - timedelta(hours=max_age_hours),))
        
        count = cursor.fetchone()[0]
        conn.close()
        return count
    
    def clear_old_products(self, max_age_hours: int = 48):
        """Remove products older than specified hours"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM products 
            WHERE scraped_at < ?
        ''', (datetime.now() - timedelta(hours=max_age_hours),))
        
        deleted = cursor.rowcount
        conn.commit()
        conn.close()
        return deleted
    
    def get_similar_products(self, 
                            liked_products: List[Dict],
                            limit: int = 50) -> List[Dict]:
        """Get products similar to liked products"""
        if not liked_products:
            return self.get_products(limit=limit)
        
        # Extract features from liked products
        brands = set()
        categories = set()
        colors = set()
        styles = set()
        
        for product in liked_products:
            if product.get('product_brand'):
                brands.add(product['product_brand'])
            if product.get('product_features', {}).get('category'):
                categories.add(product['product_features']['category'])
            if product.get('product_features', {}).get('color'):
                colors.add(product['product_features']['color'])
            if product.get('product_features', {}).get('style'):
                styles.add(product['product_features']['style'])
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Build query for similar products
        query = '''
            SELECT *, 
                (CASE WHEN brand IN ({}) THEN 3 ELSE 0 END +
                 CASE WHEN category IN ({}) THEN 2 ELSE 0 END +
                 CASE WHEN color IN ({}) THEN 2 ELSE 0 END +
                 CASE WHEN style IN ({}) THEN 2 ELSE 0 END) as similarity_score
            FROM products
            WHERE scraped_at > ?
            ORDER BY similarity_score DESC, scraped_at DESC
            LIMIT ?
        '''.format(
            ','.join('?' * len(brands)) if brands else '""',
            ','.join('?' * len(categories)) if categories else '""',
            ','.join('?' * len(colors)) if colors else '""',
            ','.join('?' * len(styles)) if styles else '""'
        )
        
        params = list(brands) + list(categories) + list(colors) + list(styles)
        params.append(datetime.now() - timedelta(hours=24))
        params.append(limit)
        
        cursor.execute(query, params)
        
        columns = [col[0] for col in cursor.description]
        products = []
        
        for row in cursor.fetchall():
            product = dict(zip(columns, row))
            if product.get('tags'):
                try:
                    product['tags'] = json.loads(product['tags'])
                except:
                    product['tags'] = []
            products.append(product)
        
        conn.close()
        return products

# Global instance
product_cache = ProductCache()
