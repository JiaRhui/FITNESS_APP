from flask import Flask, redirect, render_template, url_for

app = Flask(__name__)


@app.route("/")
def home():
    return redirect(url_for("daily_checklist"))


@app.route("/daily-checklist")
def daily_checklist():
    return render_template("DailyHabits.html")


if __name__ == "__main__":
    app.run(debug=True)
