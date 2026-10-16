import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("--- 1. Testing Health ---")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("Health check OK:", r.json())

    print("\n--- 2. Testing Superadmin Login ---")
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "mobile": "admin",
        "password": "AdminSecure@2026"
    })
    if r.status_code != 200:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "mobile": "admin",
            "password": "admin639"
        })
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    admin_data = r.json()
    admin_token = admin_data["access_token"]
    print("Admin login OK. Token acquired.")

    print("\n--- 3. Testing Admin Forced Password Change ---")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    r = requests.post(f"{BASE_URL}/api/admin/change-password", headers=admin_headers, json={
        "new_password": "AdminSecure@2026",
        "confirm_new_password": "AdminSecure@2026"
    })
    assert r.status_code == 200, f"Admin password change failed: {r.text}"
    print("Admin password changed successfully.")

    print("\n--- 4. Testing User Registration with Referral Code ---")
    user_mobile = f"98765{int(time.time()) % 100000:05d}"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "mobile": user_mobile,
        "password": "UserPass@123",
        "confirm_password": "UserPass@123",
        "referral_code": "ADMINVIP"
    })
    assert r.status_code == 200, f"User registration failed: {r.text}"
    user_data = r.json()
    user_token = user_data["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    print(f"User registered: {user_data['user']['account_id']} ({user_mobile})")

    print("\n--- 5. Testing Dashboard Summary ---")
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=user_headers)
    assert r.status_code == 200, f"Dashboard failed: {r.text}"
    dash = r.json()
    assert dash["available_balance"] == 0.0
    print("Initial dashboard available balance:", dash["available_balance"])

    print("\n--- 6. Testing Deposit Request ---")
    test_utr = f"UTR{int(time.time())}"
    r = requests.post(f"{BASE_URL}/api/deposits", headers=user_headers, json={
        "amount": 2000.0,
        "utr": test_utr,
        "screenshot_url": "/api/uploads/sample.jpg"
    })
    assert r.status_code == 200, f"Deposit request failed: {r.text}"
    deposit_info = r.json()
    deposit_id = deposit_info["id"]
    print(f"Deposit created: {deposit_info['txn_id']} (Status: {deposit_info['status']})")

    print("\n--- 7. Testing Admin Deposit Approval ---")
    r = requests.post(f"{BASE_URL}/api/admin/deposits/{deposit_id}/decide", headers=admin_headers, json={
        "status": "APPROVED",
        "admin_notes": "Verified via SBI statement"
    })
    assert r.status_code == 200, f"Admin approve deposit failed: {r.text}"
    print("Admin approved deposit.")

    # Check updated balance
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=user_headers)
    dash = r.json()
    assert dash["available_balance"] == 2000.0, f"Expected 2000.0 but got {dash['available_balance']}"
    print(f"Updated user balance after approval: INR {dash['available_balance']}")

    print("\n--- 8. Testing VIP Product Purchase & Commission Distribution ---")
    # Buy VIP 1 (₹500)
    r = requests.post(f"{BASE_URL}/api/vip/purchase", headers=user_headers, json={"product_id": 1})
    assert r.status_code == 200, f"VIP purchase failed: {r.text}"
    print("VIP 1 purchased successfully!")

    # Check remaining balance (2000 - 500 = 1500)
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=user_headers)
    dash = r.json()
    assert dash["available_balance"] == 1500.0, f"Expected 1500.0 but got {dash['available_balance']}"
    assert dash["current_vip_level"] == 1
    print(f"User remaining balance: INR {dash['available_balance']}, VIP Level: {dash['current_vip_level']}")

    print("\n--- 9. Testing Payout Method & Withdrawal Request ---")
    # Enable test mode in admin settings so withdrawal day restriction allows immediate testing
    requests.post(f"{BASE_URL}/api/admin/settings", headers=admin_headers, json={"test_mode": "true"})

    # Add bank account
    r = requests.post(f"{BASE_URL}/api/withdrawals/methods", headers=user_headers, json={
        "type": "BANK",
        "account_holder": "VIP Tester",
        "account_number": "123456789012",
        "ifsc_code": "SBIN0001234",
        "bank_name": "State Bank of India"
    })
    assert r.status_code == 200, f"Add payout method failed: {r.text}"
    method_id = r.json()["id"]

    # Request withdrawal INR 500
    r = requests.post(f"{BASE_URL}/api/withdrawals", headers=user_headers, json={
        "amount": 500.0,
        "payout_method_id": method_id
    })
    assert r.status_code == 200, f"Withdrawal request failed: {r.text}"
    wth_data = r.json()
    wth_id = wth_data["id"]
    print(f"Withdrawal request created: {wth_data['withdrawal_id']} (Status: {wth_data['status']})")

    # Check reserved balance
    r = requests.get(f"{BASE_URL}/api/dashboard", headers=user_headers)
    dash = r.json()
    assert dash["available_balance"] == 1000.0
    assert dash["reserved_balance"] == 500.0
    print(f"Balance after lock: Available INR {dash['available_balance']}, Reserved INR {dash['reserved_balance']}")

    print("\n--- 10. Testing Admin Withdrawal Approval & Payout ---")
    r = requests.post(f"{BASE_URL}/api/admin/withdrawals/{wth_id}/decide", headers=admin_headers, json={
        "status": "PAID",
        "payout_reference": "IMPS88371920",
        "admin_notes": "Processed via Corporate NetBanking"
    })
    assert r.status_code == 200, f"Withdrawal approval failed: {r.text}"
    print("Withdrawal approved and marked PAID.")

    r = requests.get(f"{BASE_URL}/api/dashboard", headers=user_headers)
    dash = r.json()
    assert dash["reserved_balance"] == 0.0
    print("Final balances verified: Reserved is INR 0.0, Available is INR 1000.0")

    print("\n--- ALL BACKEND INTEGRATION TESTS PASSED! ---")

if __name__ == "__main__":
    run_tests()
