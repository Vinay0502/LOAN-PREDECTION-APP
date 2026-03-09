from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
import pickle
import numpy as np
import os
import time
import datetime
import requests
from db import create_tables, DB_CONFIG
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Create tables if not exist
create_tables()

# Create uploads directory
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# Load ML model
model = pickle.load(open("model.pkl", "rb"))

# -----------------------
# Home Route
# -----------------------
@app.route("/")
def home():
    return "Loan Advisor Backend Running Successfully!"

# -----------------------
# Helper: DB connection
# -----------------------
def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# =======================
# User Register API
# =======================
@app.route("/register-user", methods=["POST"])
def register_user():
    data = request.json
    username = data["username"]
    password = data["password"]

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, password, "user")
        )
        conn.commit()
        return jsonify({"message": "User registered successfully"})
    except:
        return jsonify({"message": "Username already exists"}), 400
    finally:
        conn.close()

# =======================
# Admin Register API
# =======================
@app.route("/register-admin", methods=["POST"])
def register_admin():
    data = request.json
    username = data["username"]
    password = data["password"]

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, password, "admin")
        )
        conn.commit()
        return jsonify({"message": "Admin registered successfully"})
    except:
        return jsonify({"message": "Username already exists"}), 400
    finally:
        conn.close()

# =======================
# Login API
# =======================
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data["username"]
    password = data["password"]

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT role FROM users WHERE username=%s AND password=%s",
        (username, password)
    )
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({
            "message": "Login success",
            "role": user[0]
        })
    else:
        return jsonify({"message": "Invalid credentials"}), 401

# =======================
# Loan Prediction API
# =======================
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    username = data["username"]
    income = float(data["income"])
    loan_amount = float(data["loanAmount"])
    credit_score = int(data["creditScore"])
    loan_type = data["loanType"]
    tenure_years = int(data["tenure"])

    # -----------------------
    # Basic Business Rules
    # -----------------------
    if income < 7000:
        return jsonify({"error": "Monthly income must be at least ₹7000"}), 400

    if credit_score < 550:
        return jsonify({"error": "Credit score too low. Loan cannot be approved"}), 400

    # -----------------------
    # Loan Type Rules
    # -----------------------
    if loan_type == "Personal":
        annual_rate = 0.10
        max_limit = 100000
    elif loan_type == "Home":
        annual_rate = 0.08
        max_limit = 500000
    elif loan_type == "Car":
        annual_rate = 0.09
        max_limit = 300000
    elif loan_type == "Education":
        annual_rate = 0.07
        max_limit = 200000
    else:
        return jsonify({"error": "Invalid loan type"}), 400

    if loan_amount > max_limit:
        return jsonify({"error": f"{loan_type} loan limit exceeded"}), 400

    # -----------------------
    # Convert score for ML
    # -----------------------
    credit_history = 1 if credit_score >= 650 else 0

    # -----------------------
    # ML Prediction
    # -----------------------
    features = np.array([[income, loan_amount, credit_history]])
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]

    result = "Eligible" if prediction == 1 else "Not Eligible"

    # Credit Risk Label
    if credit_score >= 750:
        credit_risk = "Low"
    elif credit_score >= 650:
        credit_risk = "Medium"
    else:
        credit_risk = "High"

    # -----------------------
    # EMI Calculation (Tenure based)
    # -----------------------
    P = loan_amount
    R = annual_rate / 12
    N = tenure_years * 12

    emi = (P * R * (1 + R) ** N) / ((1 + R) ** N - 1)

    # -----------------------
    # EMI Affordability
    # -----------------------
    emi_ratio = (emi / income) * 100
    rejection_reason = None

    if emi_ratio > 50:
        result = "Not Eligible"
        rejection_reason = "EMI exceeds 50% of monthly income"
        emi_status = "Risky"
    elif emi_ratio > 30:
        emi_status = "Moderate"
    else:
        emi_status = "Safe"

    # -----------------------
    # Financial Health Analyzer
    # -----------------------
    loan_income_ratio = loan_amount / income

    if loan_income_ratio <= 10:
        financial_health = "Excellent"
    elif loan_income_ratio <= 15:
        financial_health = "Good"
    elif loan_income_ratio <= 20:
        financial_health = "Moderate"
    else:
        financial_health = "Poor"

    max_safe_loan = income * 15

    # -----------------------
    # Risk Level (ML)
    # -----------------------
    if probability > 0.75:
        risk_level = "Low Risk"
    elif probability >= 0.50:
        risk_level = "Medium Risk"
    else:
        risk_level = "High Risk"

    # -----------------------
    # Suggested Loan
    # -----------------------
    suggested_loan = None
    if result == "Not Eligible":
        suggested_loan = min(income * 20, max_limit)

    # -----------------------
    # Save to Database
    # -----------------------
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO applications
        (username, income, loan_amount, credit_history, prediction, probability)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (username, income, loan_amount, credit_history, result, probability))
    conn.commit()
    conn.close()

    # -----------------------
    # Response
    # -----------------------
    return jsonify({
        "prediction": result,
        "probability": round(float(probability), 2),
        "risk_level": risk_level,
        "credit_risk": credit_risk,
        "loan_type": loan_type,
        "tenure": tenure_years,
        "emi": round(emi, 2),
        "emi_ratio": round(emi_ratio, 2),
        "emi_status": emi_status,
        "financial_health": financial_health,
        "max_safe_loan": max_safe_loan,
        "suggested_loan": suggested_loan,
        "rejection_reason": rejection_reason
    })

# =======================
# Admin API
# =======================
@app.route("/applications", methods=["GET"])
def get_applications():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications")
    rows = cursor.fetchall()
    conn.close()
    return jsonify(rows)

# =======================
# Model Info API
# =======================
@app.route("/model-info", methods=["GET"])
def model_info():
    try:
        with open("accuracy.txt", "r") as f:
            accuracy = f.read()
    except:
        accuracy = "Not available"

    importance = model.feature_importances_

    return jsonify({
        "accuracy": accuracy,
        "feature_importance": {
            "income": round(float(importance[0]), 2),
            "loan_amount": round(float(importance[1]), 2),
            "credit_history": round(float(importance[2]), 2)
        }
    })

# =======================
# Apply for Loan API
# =======================
@app.route("/apply-loan", methods=["POST"])
def apply_loan():
    username = request.form.get("username")
    income = float(request.form.get("income"))
    loan_amount = float(request.form.get("loanAmount"))
    credit_score = int(request.form.get("creditScore"))
    loan_type = request.form.get("loanType")
    tenure = int(request.form.get("tenure"))
    emi = float(request.form.get("emi"))
    prediction = request.form.get("prediction")
    probability = float(request.form.get("probability"))
    risk_level = request.form.get("riskLevel")

    if prediction != "Eligible":
        return jsonify({"error": "Only eligible applicants can apply"}), 400

    # Handle document upload
    if "document" not in request.files:
        return jsonify({"error": "Please upload a supporting document"}), 400

    file = request.files["document"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only PDF, JPG, PNG allowed"}), 400

    # Check file size
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return jsonify({"error": "File too large. Maximum 5 MB allowed"}), 400

    # Save file with unique name
    original_name = secure_filename(file.filename)
    unique_name = f"{username}_{int(time.time())}_{original_name}"
    file.save(os.path.join(UPLOAD_FOLDER, unique_name))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO loan_applications
        (username, income, loan_amount, credit_score, loan_type, tenure, emi, prediction, probability, risk_level, document_filename)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (username, income, loan_amount, credit_score, loan_type, tenure, emi, prediction, probability, risk_level, unique_name))
    conn.commit()
    conn.close()

    return jsonify({"message": "Loan application submitted successfully"})

# =======================
# Serve Uploaded Documents
# =======================
@app.route("/uploads/<filename>", methods=["GET"])
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# =======================
# My Applications API
# =======================
@app.route("/my-applications", methods=["GET"])
def my_applications():
    username = request.args.get("username")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, loan_type, loan_amount, emi, credit_score, tenure, prediction,
               probability, risk_level, status, admin_remarks, document_filename, applied_at
        FROM loan_applications
        WHERE username = %s
        ORDER BY applied_at DESC
    """, (username,))
    rows = cursor.fetchall()
    conn.close()

    applications = []
    for row in rows:
        applications.append({
            "id": row[0],
            "loanType": row[1],
            "loanAmount": row[2],
            "emi": row[3],
            "creditScore": row[4],
            "tenure": row[5],
            "prediction": row[6],
            "probability": row[7],
            "riskLevel": row[8],
            "status": row[9],
            "adminRemarks": row[10],
            "documentFilename": row[11],
            "appliedAt": row[12]
        })

    return jsonify(applications)

# =======================
# All Loan Applications (Admin)
# =======================
@app.route("/all-loan-applications", methods=["GET"])
def all_loan_applications():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, loan_type, loan_amount, income, emi, credit_score,
               tenure, prediction, probability, risk_level, status, admin_remarks, document_filename, applied_at
        FROM loan_applications
        ORDER BY applied_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    applications = []
    for row in rows:
        applications.append({
            "id": row[0],
            "username": row[1],
            "loanType": row[2],
            "loanAmount": row[3],
            "income": row[4],
            "emi": row[5],
            "creditScore": row[6],
            "tenure": row[7],
            "prediction": row[8],
            "probability": row[9],
            "riskLevel": row[10],
            "status": row[11],
            "adminRemarks": row[12],
            "documentFilename": row[13],
            "appliedAt": row[14]
        })

    return jsonify(applications)

# =======================
# Update Application Status (Admin)
# =======================
@app.route("/update-application-status", methods=["PUT"])
def update_application_status():
    data = request.json
    app_id = data["id"]
    status = data["status"]
    remarks = data.get("admin_remarks", "")

    if status not in ["Approved", "Rejected"]:
        return jsonify({"error": "Invalid status"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE loan_applications
        SET status = %s, admin_remarks = %s
        WHERE id = %s
    """, (status, remarks, app_id))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Application {status} successfully"})

# =======================
# Chatbot API
# =======================
CHATBOT_RESPONSES = {
    "emi": "EMI (Equated Monthly Installment) is the fixed amount you pay every month to repay your loan. It depends on the loan amount, interest rate, and tenure.",
    "eligibility": "Loan eligibility depends on your monthly income (min ₹7,000), credit score (min 550), and the loan amount relative to your income. Use our Loan Predictor to check!",
    "credit score": "A credit score ranges from 300-900. Above 750 is excellent, 650-749 is good, below 650 may face difficulties. A higher score improves your loan approval chances.",
    "loan type": "We offer 4 types of loans:\n• Personal Loan — up to ₹1,00,000 at 10% interest\n• Home Loan — up to ₹5,00,000 at 8% interest\n• Car Loan — up to ₹3,00,000 at 9% interest\n• Education Loan — up to ₹2,00,000 at 7% interest",
    "apply": "To apply for a loan: Login → Fill the Loan Form → Click Predict → If Eligible, upload a document and click 'Apply for This Loan'.",
    "status": "You can track your application status in 'My Applications'. Status can be: Pending, Approved, or Rejected. Admin will review and update it.",
    "document": "When applying, you must upload a supporting document (PDF, JPG, or PNG, max 5 MB). This can be your Aadhaar card, PAN card, income proof, etc.",
    "interest": "Interest rates vary by loan type:\n• Personal: 10% per year\n• Home: 8% per year\n• Car: 9% per year\n• Education: 7% per year",
    "tenure": "You can choose a loan tenure of 3, 5, or 7 years. A longer tenure means lower EMI but more total interest paid.",
    "reject": "Loans may be rejected if: EMI exceeds 50% of income, credit score is below 550, income is below ₹7,000, or loan amount exceeds the type limit.",
    "contact": "For further assistance, please contact our support team at support@loanadvisor.com or call 1800-XXX-XXXX.",
}

@app.route("/chatbot", methods=["POST"])
def chatbot():
    data = request.json
    message = data.get("message", "").lower().strip()

    if not message:
        return jsonify({"reply": "Please type a message to get help."})

    # Check for keyword matches
    for keyword, response in CHATBOT_RESPONSES.items():
        if keyword in message:
            return jsonify({"reply": response})

    # Greetings
    greetings = ["hi", "hello", "hey", "hii", "helo"]
    if any(g == message or message.startswith(g + " ") for g in greetings):
        return jsonify({"reply": "Hello! 👋 I'm your Loan Advisor Assistant. Ask me about EMI, eligibility, loan types, credit score, how to apply, or document requirements."})

    # Thank you
    if "thank" in message:
        return jsonify({"reply": "You're welcome! 😊 Feel free to ask if you have more questions."})

    # Default fallback
    return jsonify({
        "reply": "I'm not sure about that. Try asking about:\n• EMI calculation\n• Loan eligibility\n• Credit score\n• Loan types & interest rates\n• How to apply\n• Document requirements\n• Application status\n• Tenure options"
    })

# =======================
# User Analytics API
# =======================
@app.route("/user-analytics", methods=["GET"])
def user_analytics():
    username = request.args.get("username")

    conn = get_db()
    cursor = conn.cursor()

    # Total counts
    cursor.execute("SELECT COUNT(*) FROM loan_applications WHERE username = %s", (username,))
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM loan_applications WHERE username = %s AND status = 'Approved'", (username,))
    approved = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM loan_applications WHERE username = %s AND status = 'Rejected'", (username,))
    rejected = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM loan_applications WHERE username = %s AND status = 'Pending'", (username,))
    pending = cursor.fetchone()[0]

    # Totals
    cursor.execute("SELECT COALESCE(SUM(loan_amount), 0), COALESCE(AVG(emi), 0) FROM loan_applications WHERE username = %s", (username,))
    row = cursor.fetchone()
    total_loan_amount = row[0]
    average_emi = round(row[1], 2)

    # By loan type
    cursor.execute("SELECT loan_type, COUNT(*) FROM loan_applications WHERE username = %s GROUP BY loan_type", (username,))
    by_type = {}
    for r in cursor.fetchall():
        by_type[r[0]] = r[1]

    # Recent applications for bar chart
    cursor.execute("""
        SELECT loan_type, loan_amount, status, applied_at
        FROM loan_applications WHERE username = %s
        ORDER BY applied_at DESC LIMIT 10
    """, (username,))
    recent = []
    for r in cursor.fetchall():
        recent.append({
            "loanType": r[0],
            "loanAmount": r[1],
            "status": r[2],
            "appliedAt": r[3]
        })

    conn.close()

    return jsonify({
        "totalApplications": total,
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
        "totalLoanAmount": total_loan_amount,
        "averageEMI": average_emi,
        "applicationsByType": by_type,
        "recentApplications": recent
    })

# =======================
# Billplz Configuration
# =======================
BILLPLZ_API_KEY = "73eb57f0-7d4e-42b9-a544-aeac6e4b0f81"  # Sandbox Demo API Key
BILLPLZ_COLLECTION_ID = "inbmmepb"  # Sandbox Demo Collection ID
BILLPLZ_URL = "https://www.billplz-sandbox.com/api/v3/bills"

# =======================
# EMI Payment API (Billplz Integration)
# =======================
@app.route("/create-billplz-bill", methods=["POST"])
def create_billplz_bill():
    data = request.json
    username = data["username"]
    loan_id = data["loan_id"]
    amount = float(data["amount"])
    month = int(data["month"])
    year = int(data["year"])

    conn = get_db()
    cursor = conn.cursor()
    
    # Check if already paid or pending for this month
    cursor.execute(
        "SELECT id, status FROM emi_payments WHERE loan_id=%s AND month=%s AND year=%s AND status='Paid'",
        (loan_id, month, year)
    )
    existing_payment = cursor.fetchone()
    
    if existing_payment:
        conn.close()
        return jsonify({"error": "EMI already paid for this month"}), 400

    try:
        # ---- MOCK PAYMENT GATEWAY ----
        # Simulating a successful payment without external API
        import uuid
        fake_bill_id = "mock_" + str(uuid.uuid4())[:8]
        
        # Record in our database as Paid (simulating instant successful payment)
        cursor.execute("""
            INSERT INTO emi_payments (username, loan_id, amount, month, year, status, billplz_id)
            VALUES (%s, %s, %s, %s, %s, 'Paid', %s)
        """, (username, loan_id, amount, month, year, fake_bill_id))
        conn.commit()
        
        # Return local URL to redirect back to the app (this will reload the page and show Paid status)
        return jsonify({"url": "/my-applications", "billplz_id": fake_bill_id})
        # ------------------------------
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# =======================
# Billplz Webhook
# =======================
@app.route("/billplz-webhook", methods=["POST"])
def billplz_webhook():
    data = request.form
    billplz_id = data.get('id')
    state = data.get('state') 
    paid = data.get('paid') 
    
    if state == 'paid' or paid == 'true':
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE emi_payments SET status = 'Paid' WHERE billplz_id = %s", (billplz_id,))
        conn.commit()
        conn.close()
    
    return jsonify({"message": "Webhook received"}), 200

# =======================
# Notifications API
# =======================
@app.route("/notifications", methods=["GET"])
def get_notifications():
    username = request.args.get("username")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get all approved loans for the user
    cursor.execute("""
        SELECT id, loan_type, emi
        FROM loan_applications
        WHERE username = %s AND status = 'Approved'
    """, (username,))
    approved_loans = cursor.fetchall()
    
    notifications = []
    
    now = datetime.datetime.now()
    current_month = now.month
    current_year = now.year
    
    for loan in approved_loans:
        loan_id = loan[0]
        loan_type = loan[1]
        emi = loan[2]
        
        # Check if EMI is paid for current month
        cursor.execute("""
            SELECT id FROM emi_payments
            WHERE loan_id = %s AND month = %s AND year = %s AND status = 'Paid'
        """, (loan_id, current_month, current_year))
        payment = cursor.fetchone()
        
        if not payment:
            notifications.append({
                "id": f"due_{loan_id}_{current_month}_{current_year}",
                "type": "emi_due",
                "message": f"Your EMI of ₹{emi} for {loan_type} Loan is due for this month.",
                "loan_id": loan_id,
                "amount": emi,
                "month": current_month,
                "year": current_year
            })
            
    conn.close()
    
    return jsonify(notifications)

# =======================
# Run Server
# =======================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
