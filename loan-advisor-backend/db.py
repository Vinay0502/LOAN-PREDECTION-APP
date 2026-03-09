import mysql.connector
import os

# MySQL Connection Configuration (reads from environment variables, falls back to local defaults)
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", 3306)),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "loan_advisor")
}

def get_connection():
    """Get a MySQL connection. Creates the database if it doesn't exist."""
    # First connect without database to ensure it exists
    init_config = {k: v for k, v in DB_CONFIG.items() if k != "database"}
    init_conn = mysql.connector.connect(**init_config)
    init_cursor = init_conn.cursor()
    init_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
    init_conn.close()

    # Now connect to the actual database
    return mysql.connector.connect(**DB_CONFIG)

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50)
    )
    """)

    # Applications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255),
        income DOUBLE,
        loan_amount DOUBLE,
        credit_history INT,
        prediction VARCHAR(50),
        probability DOUBLE
    )
    """)

    # Loan Applications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loan_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255),
        income DOUBLE,
        loan_amount DOUBLE,
        credit_score INT,
        loan_type VARCHAR(100),
        tenure INT,
        emi DOUBLE,
        prediction VARCHAR(50),
        probability DOUBLE,
        risk_level VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Pending',
        admin_remarks TEXT,
        document_filename VARCHAR(500),
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # EMI Payments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emi_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255),
        loan_id INT,
        amount DOUBLE,
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        month INT,
        year INT,
        status VARCHAR(50) DEFAULT 'Pending',
        billplz_id VARCHAR(255),
        FOREIGN KEY(loan_id) REFERENCES loan_applications(id)
    )
    """)

    conn.commit()
    conn.close()