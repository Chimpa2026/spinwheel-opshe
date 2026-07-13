import json
import os
import random
import time
from datetime import datetime
from functools import wraps

from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "store.json")
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
ALLOWED_LOGO_EXT = {"png", "jpg", "jpeg", "webp", "svg"}

MIN_PRIZES = 2
MAX_PRIZES = 10

os.makedirs(UPLOAD_DIR, exist_ok=True)

app = Flask(__name__)
# Di Railway, set env var SECRET_KEY dengan string acak yang rahasia.
# Kalau env var belum di-set, pakai fallback ini (JANGAN dipakai untuk production beneran).
app.secret_key = os.environ.get("SECRET_KEY", "ganti-dengan-kunci-rahasia-punya-lo")
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # maks 5MB untuk upload logo


# ---------- Helper baca/tulis data ----------

def load_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login"))
        return view(*args, **kwargs)
    return wrapped


# ---------- Halaman publik: spin wheel ----------

@app.route("/")
def wheel():
    data = load_data()
    return render_template(
        "wheel.html",
        brand=data["brand"],
        prizes=data["prizes"],
    )


@app.route("/api/spin", methods=["POST"])
def api_spin():
    data = load_data()
    prizes = data["prizes"]
    index = random.randrange(len(prizes))
    prize = prizes[index]

    data["history"].insert(0, {
        "prize": prize,
        "time": datetime.now().strftime("%d-%m-%Y %H:%M:%S"),
    })
    data["history"] = data["history"][:100]  # simpan max 100 riwayat terakhir
    save_data(data)

    return jsonify({"index": index, "prize": prize})


# ---------- Auth ----------

@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        data = load_data()
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        admin = data["admin"]

        if username == admin["username"] and check_password_hash(admin["password_hash"], password):
            session["logged_in"] = True
            session["username"] = username
            return redirect(url_for("admin_page"))
        error = "Username atau password salah."

    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ---------- Admin ----------

def _allowed_logo(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_LOGO_EXT


@app.route("/admin", methods=["GET", "POST"])
@login_required
def admin_page():
    data = load_data()
    message = None
    error = None

    if request.method == "POST":
        action = request.form.get("action")

        if action == "save_wheel":
            data["brand"]["handle"] = request.form.get("brand_handle", data["brand"]["handle"]).strip()

            if request.form.get("remove_logo") == "1":
                old_logo = data["brand"].get("logo")
                if old_logo:
                    old_path = os.path.join(BASE_DIR, "static", old_logo)
                    if os.path.exists(old_path):
                        os.remove(old_path)
                data["brand"]["logo"] = None

            logo_file = request.files.get("logo")
            if logo_file and logo_file.filename:
                if _allowed_logo(logo_file.filename):
                    ext = logo_file.filename.rsplit(".", 1)[1].lower()
                    fname = f"logo_{int(time.time())}.{ext}"
                    logo_file.save(os.path.join(UPLOAD_DIR, fname))
                    old_logo = data["brand"].get("logo")
                    if old_logo:
                        old_path = os.path.join(BASE_DIR, "static", old_logo)
                        if os.path.exists(old_path):
                            os.remove(old_path)
                    data["brand"]["logo"] = f"uploads/{fname}"
                else:
                    error = "Format logo tidak didukung. Pakai PNG, JPG, WEBP, atau SVG."

            raw_prizes = request.form.getlist("prizes[]")
            cleaned = [p.strip() for p in raw_prizes if p.strip()]

            if len(cleaned) < MIN_PRIZES:
                error = f"Minimal {MIN_PRIZES} panel hadiah harus diisi."
            else:
                if len(cleaned) > MAX_PRIZES:
                    cleaned = cleaned[:MAX_PRIZES]
                data["prizes"] = cleaned
                save_data(data)
                if not error:
                    message = "Perubahan berhasil disimpan."

        elif action == "clear_history":
            data["history"] = []
            save_data(data)
            message = "Riwayat pemenang berhasil dihapus."

        elif action == "change_password":
            new_pass = request.form.get("new_password", "")
            confirm_pass = request.form.get("confirm_password", "")
            if len(new_pass) < 6:
                message = "Password baru minimal 6 karakter."
            elif new_pass != confirm_pass:
                message = "Konfirmasi password tidak cocok."
            else:
                data["admin"]["password_hash"] = generate_password_hash(new_pass)
                save_data(data)
                message = "Password berhasil diganti."

    data = load_data()
    return render_template(
        "admin.html",
        data=data,
        message=message,
        error=error,
        min_prizes=MIN_PRIZES,
        max_prizes=MAX_PRIZES,
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=port)
