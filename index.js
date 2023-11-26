const express = require("express");
const { google } = require("googleapis");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Function to get authentication client
async function getAuthClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    return auth.getClient();
}

// Function to get values from Google Sheet
async function getSheetValues(auth, spreadsheetId, range) {
    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values;
}

app.get("/", async (req, res) => {
    const auth = await getAuthClient();

    const spreadsheetId = "1uUumH7kO0ptmM8tj0dLHK0orMq_om9ceLA2wdALwWKM";

    // Fetch check-in data
    const checkInValues = await getSheetValues(auth, spreadsheetId, "Iot!C4:C7");

    // Get state of light
    const lightStateResponse = await getSheetValues(auth, spreadsheetId, "Iot!C2:C2");
    const lightState = lightStateResponse[0][0] || null;

    // Get state of AC
    const acStateResponse = await getSheetValues(auth, spreadsheetId, "Iot!B2:B2");
    const acState = acStateResponse[0][0] || null;

    res.render("index", { checkInValues, lightState, acState });
});

// New route to handle toggling Light State
app.post("/updateLightState", async (req, res) => {
    const auth = await getAuthClient();
    const spreadsheetId = "1uUumH7kO0ptmM8tj0dLHK0orMq_om9ceLA2wdALwWKM";
    
    const googleSheets = google.sheets({ version: "v4", auth });

    // Get the current state of the light
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Iot!C2:C2",
    });

    // Extract the current value
    const currentValue = response.data.values[0][0];

    // Toggle the state of the light
    const newLightState = currentValue === "2on" ? "2off" : "2on";

    // Update the cell with the new value
    await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: "Iot!C2:C2",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [[newLightState]],
        },
    });

    res.redirect("/"); // Redirect back to the home page after updating
});

// New route to handle toggling AC State
app.post("/updateACState", async (req, res) => {
    const auth = await getAuthClient();
    const spreadsheetId = "1uUumH7kO0ptmM8tj0dLHK0orMq_om9ceLA2wdALwWKM";
    
    const googleSheets = google.sheets({ version: "v4", auth });

    // Get the current state of the AC
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Iot!B2:B2",
    });

    // Extract the current value
    const currentValue = response.data.values[0][0];

    // Toggle the state of the AC
    const newACState = currentValue === "1on" ? "1off" : "1on";

    // Update the cell with the new value
    await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: "Iot!B2:B2",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [[newACState]],
        },
    });

    res.redirect("/"); // Redirect back to the home page after updating
});


app.listen(1337, () => console.log("running on 1337"));
