const express = require("express");
const { google } = require("googleapis");

const app = express();
let loggedIn = false;
let username, password;

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
    // Redirect to login page if not logged in
    if (!loggedIn) {
        res.redirect("/login");
        return;
    }

    const auth = await getAuthClient();

    const spreadsheetId = "1uUumH7kO0ptmM8tj0dLHK0orMq_om9ceLA2wdALwWKM";

    // Fetch check-in data
    const checkInValues = await getSheetValues(auth, spreadsheetId, "Iot!C4:C7");

    // Get state of light
    const lightStateResponse = await getSheetValues(auth, spreadsheetId, "Iot!C2:C2");
    const lightState = lightStateResponse[0][0] || null;

    // Get state of Door
    const doorStateResponse = await getSheetValues(auth, spreadsheetId, "Iot!B2:B2");
    const doorState = doorStateResponse[0][0] || null;

    res.render("index", { checkInValues, lightState, doorState });
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

// New route to handle toggling Door State
app.post("/updateDoorState", async (req, res) => {
    const auth = await getAuthClient();
    const spreadsheetId = "1uUumH7kO0ptmM8tj0dLHK0orMq_om9ceLA2wdALwWKM";

    const googleSheets = google.sheets({ version: "v4", auth });

    // Get the current state of the Door
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Iot!B2:B2",
    });

    // Extract the current value
    const currentValue = response.data.values[0][0];

    // Toggle the state of the Door
    const newDoorState = currentValue === "1on" ? "1off" : "1on";

    // Update the cell with the new value
    await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: "Iot!B2:B2",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [[newDoorState]],
        },
    });

    res.redirect("/"); // Redirect back to the home page after updating
});

app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
    username = req.body.username;
    password = req.body.password;

    const auth = await getAuthClient();

    const spreadsheetId = "1uUumH7kO0ptmM8tj0dLHK0orMq_om9ceLA2wdALwWKM";

    const accountData = await getSheetValues(auth, spreadsheetId, "Account!A2:B");

    const authSuccessful = accountData.some((row) => row[0] === username && row[1] === password);

    if (authSuccessful) {
        loggedIn = true;
        res.redirect("/");
    } else {
        loggedIn = false;
        res.render("login", { error: "Invalid credentials" });
    }
});

app.get("/logout", (req, res) => {
    loggedIn = false;
    res.redirect("/login");
});


app.listen(1337, () => console.log("running on 1337"));
