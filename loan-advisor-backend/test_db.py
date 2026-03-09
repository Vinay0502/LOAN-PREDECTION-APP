import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        port=3306,
        user="root",
        password=""
    )
    print("MySQL connection successful!")
    
    cursor = conn.cursor()
    cursor.execute("SHOW DATABASES")
    print("Available databases:", [db[0] for db in cursor.fetchall()])
    
    conn.close()
except mysql.connector.Error as err:
    print(f"MySQL connection failed: {err}")