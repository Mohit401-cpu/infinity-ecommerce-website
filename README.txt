INFINITY E-COMMERCE WEBSITE (FLASK + SQLITE)

1. Open this folder in VS Code.
2. Create and activate a virtual environment:
   python -m venv venv
   Windows: venv\\Scripts\\activate
3. Install dependencies:
   pip install -r requirements.txt
4. Create the SQLite database:
   python init_db.py
5. Start the Flask application:
   python app.py
6. Open:
   http://127.0.0.1:5000/

API ENDPOINTS
GET  /api/products              List all products
GET  /api/products/<id>         Get one product
POST /api/products              Add a product (JSON body)

The original Infinity HTML and CSS design are retained. The JavaScript now
loads product records from the Flask API instead of the hardcoded array.
Product photos and logo are served from static/images/.
