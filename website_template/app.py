from flask import Flask, render_template, jsonify, request
import sqlite3
app = Flask(__name__)

# Route to serve the HTML template
@app.route("/")
def index():
    return render_template("culture_data.html")

# API: Chart data by state
@app.route("/get_chart_data")
def chart_data():
    connection = sqlite3.connect("data/data.db")
    cursor = connection.cursor()

    query = """
    SELECT 
        State, 
        Country, 
        CAST("2021_%_of_australian_population" AS FLOAT)
    FROM states_country_data
    ORDER BY State, CAST("2021_%_of_australian_population" AS FLOAT) DESC
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    connection.close()

    data_by_state = {}
    for state, country, percentage in rows:
        if state not in data_by_state:
            data_by_state[state] = {"labels": [], "data": []}
        data_by_state[state]["labels"].append(country)
        data_by_state[state]["data"].append(percentage)

    return jsonify(data_by_state)

# API: Country + cultural details for a given state
@app.route("/get_row_details", methods=["GET"])
def get_row_details():
    selected_country = request.args.get("country")
    selected_state = request.args.get("state")

    connection = sqlite3.connect("data/data.db")
    cursor = connection.cursor()

    query = """
    SELECT  
        T1.State, 
        T1.Country,
        T2.Common_Languages,
        T2.Common_Religions,
        T2.Common_Sports,
        T2.Common_Festivals,
        T2.Common_Foods,
        T2.Common_Clothing
    FROM states_country_data AS T1
    LEFT JOIN country_cultural AS T2
        ON T1.Country = T2.Country
    WHERE T1.Country = ? AND T1.State = ?
    """

    cursor.execute(query, (selected_country, selected_state))
    data = cursor.fetchone()
    cursor.close()
    connection.close()

    if data:
        return jsonify({
            "State": data[0],
            "Country": data[1],
            "Languages": data[2],
            "Religions": data[3],
            "Sports": data[4],
            "Festivals": data[5],
            "Foods": data[6],
            "Clothing": data[7],
        })
    return jsonify({})

if __name__ == "__main__":
    app.run(debug=True)