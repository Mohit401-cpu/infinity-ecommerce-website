from flask import Flask, jsonify, render_template, request
import sqlite3
import os

app = Flask(__name__)
DATABASE = os.path.join("database", "products.db")


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_db_connection()
    products = conn.execute(
        "SELECT id, name, category, description, price, image, tag "
        "FROM products ORDER BY id"
    ).fetchall()
    conn.close()
    return jsonify([dict(product) for product in products]), 200


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    conn = get_db_connection()
    product = conn.execute(
        "SELECT id, name, category, description, price, image, tag "
        "FROM products WHERE id = ?",
        (product_id,)
    ).fetchone()
    conn.close()

    if product is None:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(dict(product)), 200


@app.route("/api/products", methods=["POST"])
def add_product():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    required_fields = ["name", "category", "description", "price"]
    for field in required_fields:
        if field not in data or str(data[field]).strip() == "":
            return jsonify({"error": f"{field} is required"}), 400

    try:
        price = float(data["price"])
        if price <= 0:
            return jsonify({"error": "Price must be greater than zero"}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "Price must be a valid number"}), 400

    name = str(data["name"]).strip()
    category = str(data["category"]).strip()
    description = str(data["description"]).strip()
    image = str(data.get("image", "")).strip()
    tag = str(data.get("tag", "Featured")).strip() or "Featured"

    conn = get_db_connection()
    cursor = conn.execute(
        """INSERT INTO products
           (name, category, description, price, image, tag)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (name, category, description, price, image, tag)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "message": "Product added successfully",
        "product_id": new_id
    }), 201


if __name__ == "__main__":
    os.makedirs("database", exist_ok=True)
    app.run(debug=True)
