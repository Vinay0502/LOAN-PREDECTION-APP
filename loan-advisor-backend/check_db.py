import mysql.connector

# MySQL Connection Configuration
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "loan_advisor"
}

conn = mysql.connector.connect(**DB_CONFIG)
c = conn.cursor()

print("emi_payments structure:")
c.execute("DESCRIBE emi_payments")
for row in c.fetchall():
    print(row)

print("\nloan_applications structure:")
c.execute("DESCRIBE loan_applications")
for row in c.fetchall():
    print(row)

conn.close()
