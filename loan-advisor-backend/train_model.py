import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle

# Load dataset
df = pd.read_csv("loan_data.csv")

# Select required columns
df = df[[
    "ApplicantIncome",
    "LoanAmount",
    "Credit_History",
    "Loan_Status"
]]

# Rename columns
df.columns = ["income", "loan_amount", "credit_history", "approved"]

# Convert target
df["approved"] = df["approved"].map({"Y": 1, "N": 0})

# Handle missing values
df["credit_history"].fillna(0, inplace=True)
df["loan_amount"].fillna(df["loan_amount"].mean(), inplace=True)

# Features and target
X = df[["income", "loan_amount", "credit_history"]]
y = df["approved"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier(n_estimators=200)
model.fit(X_train, y_train)

# Accuracy
accuracy = model.score(X_test, y_test)
print("Accuracy:", accuracy)

# Save model
pickle.dump(model, open("model.pkl", "wb"))

# Save accuracy
with open("accuracy.txt", "w") as f:
    f.write(str(round(accuracy * 100, 2)))

print("Model trained and saved successfully")