import flask

app: flask.Flask = flask.Flask(__name__)

@app.route("/")
def index():
    return flask.render_template("index.html")

if __name__ == "__main__":
    app.run("0.0.0.0", port=8375, debug=True)
