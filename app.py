import os
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

ALUU_API_KEY = os.getenv("ALUU_API_KEY")
ALUU_API_URL = "https://aluu.in/api/check/bgmi"


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/player")
def get_player():
    uid = request.args.get("uid", "").strip()

    # Reject empty UID
    if not uid:
        return jsonify({
            "success": False,
            "message": "Please enter a BGMI UID."
        }), 400

    # Validate numbers only
    if not uid.isdigit():
        return jsonify({
            "success": False,
            "message": "BGMI UID must contain numbers only."
        }), 400

    # Security check: Ensure server has API key configured
    if not ALUU_API_KEY:
        print("ALUU ERROR: ALUU_API_KEY is not configured in .env")
        return jsonify({
            "success": False,
            "message": "Verification service is temporarily unavailable."
        }), 500

    try:
        response = requests.get(
            ALUU_API_URL,
            params={
                "gameCode": "bgmi",
                "id": uid
            },
            headers={
                "x-api-key": ALUU_API_KEY
            },
            timeout=20
        )

        # Log safe status code only - NEVER log the API key
        print(f"ALUU STATUS: {response.status_code}")

        if response.status_code == 429:
            return jsonify({
                "success": False,
                "message": "Verification limit reached. Please try again later."
            }), 429

        if response.status_code == 404:
            return jsonify({
                "success": False,
                "message": "BGMI player not found."
            }), 404

        if response.status_code != 200:
            return jsonify({
                "success": False,
                "message": "Unable to verify BGMI UID right now."
            }), 502

        data = response.json()

        # Check API success flag
        if not data.get("success"):
            return jsonify({
                "success": False,
                "message": "BGMI player not found."
            }), 404

        payload = data.get("data", {})
        is_valid = payload.get("isValid")
        username = payload.get("username")

        if not is_valid or not username:
            return jsonify({
                "success": False,
                "message": "BGMI player not found."
            }), 404

        # Clean successful response
        return jsonify({
            "success": True,
            "player": {
                "uid": uid,
                "username": username
            }
        })

    except requests.exceptions.Timeout:
        return jsonify({
            "success": False,
            "message": "Verification request timed out. Please try again."
        }), 504

    except requests.exceptions.RequestException:
        return jsonify({
            "success": False,
            "message": "Unable to verify BGMI account. Please try again."
        }), 502

    except ValueError:
        return jsonify({
            "success": False,
            "message": "Unable to verify BGMI UID right now."
        }), 502


@app.route("/api/order", methods=["POST"])
def create_order():
    payload = request.get_json(silent=True) or {}
    uid = str(payload.get("uid", "")).strip()
    username = str(payload.get("username", "")).strip()
    package_id = payload.get("packageId")
    amount = payload.get("amount")

    if not uid or not uid.isdigit() or not username or not package_id or not amount:
        return jsonify({
            "success": False,
            "message": "Invalid order parameters. Please verify your UID and package."
        }), 400

    # Return simulated checkout confirmation with verified credentials
    order_id = f"NEX-{os.urandom(4).hex().upper()}"
    return jsonify({
        "success": True,
        "order": {
            "orderId": order_id,
            "uid": uid,
            "username": username,
            "amount": amount,
            "packageId": package_id,
            "status": "Ready for Payment",
            "message": "Player verified. Order initiated successfully."
        }
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )