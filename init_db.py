import sqlite3
import os

os.makedirs("database", exist_ok=True)
conn = sqlite3.connect(os.path.join("database", "products.db"))

conn.execute("""
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL CHECK(price > 0),
    image TEXT,
    tag TEXT DEFAULT 'Featured'
)
""")

sample_products = [
    (
        "Wireless Headphones",
        "Electronics",
        "Enjoy immersive sound, comfortable listening, and a clean modern design for everyday use.",
        1499,
        "headphones.png",
        "Bestseller"
    ),
    (
        "Smart Watch",
        "Accessories",
        "Keep track of your daily activity and stay connected with a stylish smartwatch.",
        2499,
        "smartwatch.png",
        "Popular"
    ),
    (
        "Running Shoes",
        "Footwear",
        "Discover everyday comfort with lightweight running shoes designed for an active lifestyle.",
        1999,
        "running shoes.png",
        "Featured"
    )
]

count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
if count == 0:
    conn.executemany("""
        INSERT INTO products
        (name, category, description, price, image, tag)
        VALUES (?, ?, ?, ?, ?, ?)
    """, sample_products)

conn.commit()
conn.close()

print("Database initialized successfully.")
print("Three sample products are ready.")
