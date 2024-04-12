const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies
app.use(bodyParser.json());

/*------------ Connection Setup-----------*/
let VisMinDB_State = true;
let CentralDB_State = true;
let LuzonDB_State = true;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



// Central to Luzon Database Connection
const centralToLuzonConnection = mysql.createConnection({
    host: process.env.CENTRAL_TO_LUZON_HOST,
    port: process.env.CENTRAL_TO_LUZON_PORT,
    user: process.env.CENTRAL_TO_LUZON_USER,
    password: process.env.CENTRAL_TO_LUZON_PASSWORD,
    database: process.env.CENTRAL_TO_LUZON_DATABASE
});

// Central to VisMin Database Connection
const centralToVisMinConnection = mysql.createConnection({
    host: process.env.CENTRAL_TO_VISMIN_HOST,
    port: process.env.CENTRAL_TO_VISMIN_PORT,
    user: process.env.CENTRAL_TO_VISMIN_USER,
    password: process.env.CENTRAL_TO_VISMIN_PASSWORD,
    database: process.env.CENTRAL_TO_VISMIN_DATABASE
});

// Luzon Database Connection
const luzonConnection = mysql.createConnection({
    host: process.env.LUZON_HOST,
    port: process.env.LUZON_PORT,
    user: process.env.LUZON_USER,
    password: process.env.LUZON_PASSWORD,
    database: process.env.LUZON_DATABASE
});

// VisMin Database Connection
const visMinConnection = mysql.createConnection({
    host: process.env.VISMIN_HOST,
    port: process.env.VISMIN_PORT,
    user: process.env.VISMIN_USER,
    password: process.env.VISMIN_PASSWORD,
    database: process.env.VISMIN_DATABASE
});

let CentralVM = centralToVisMinConnection;
let CentralL = centralToLuzonConnection;
let Luzon = luzonConnection;
let VisMin = visMinConnection;


/*------------ Connection Initialize-----------*/
// Connect to Central Database
centralToLuzonConnection.connect(err => {
    if (err) {
        console.error('Error connecting to Central database:', err);
        return;
    }
    console.log('Connected to Central-Luzon database');
});

// Connect to Central Database
centralToVisMinConnection.connect(err => {
    if (err) {
        console.error('Error connecting to Central-VisMin database:', err);
        return;
    }
    console.log('Connected to Central database');
});

// Connect to Luzon Recovery Database
luzonConnection.connect(err => {
    if (err) {
        console.error('Error connecting to Luzon database:', err);
        return;
    }
    console.log('Connected to Luzon Recovery database');
});

// Connect to VisMin Recovery Database
visMinConnection.connect(err => {
    if (err) {
        console.error('Error connecting to VisMin database:', err);
        return;
    }
    console.log('Connected to VisMin Recovery database');
});

/*-----------Connection Function--------*/

// Route to handle closing connection to Central
app.get('/dbChange', (req, res) => {
    const action = req.query.action;
    switch (action) {
        case 'closeConnectionToCentral':
            CentralDB_State = false;
            res.json({ success: true });
            break;
        case 'closeConnectionToVisMin':
            VisMinDB_State = false;
            res.json({ success: true });
            break;
        case 'closeConnectionToLuzon':
            LuzonDB_State = false
            res.json({ success: true });
            break;
        case 'openConnectionToCentral':
            CentralDB_State = true;
            RecoveryFunction();
            res.json({ success: true });
            break;
        case 'openConnectionToVisMin':
            VisMinDB_State = true;
            RecoveryFunction();
            res.json({ success: true });
            break;
        case 'openConnectionToLuzon':
            LuzonDB_State = true;
            RecoveryFunction();
            res.json({ success: true });
            break;
        default:
            res.status(400).json({ error: 'Invalid action' });
    }
});

function writeToLogFile(sql, values, connection) {
    // Define the path to the log file
    const logFilePath = 'database_log.json';

    // Create an object with the data
    const data = {
        sql: sql,
        values: values,
        connection: connection
    };

    // Read the existing log file content
    fs.readFile(logFilePath, 'utf8', (readErr, content) => {
        if (readErr && readErr.code !== 'ENOENT') {
            // Handle read error
            console.error('Error reading log file:', readErr);
            return;
        }

        let logs = [];
        if (content) {
            // Parse existing content as JSON
            try {
                logs = JSON.parse(content);
            } catch (parseErr) {
                // Handle parsing error
                console.error('Error parsing log file content:', parseErr);
                return;
            }
        }

        // Append the new data to the log file
        logs.push(data);

        // Write the updated logs back to the file
        fs.writeFile(logFilePath, JSON.stringify(logs, null, 4), 'utf8', (writeErr) => {
            if (writeErr) {
                // Handle write error
                console.error('Error writing to log file:', writeErr);
                return;
            }
            console.log('Data has been written to log file successfully.');
        });
    });
}

// Example usage:
//writeToLogFile("SELECT * FROM table", [1, 2, 3], "Central");
//writeToLogFile("SELECT * FROM table", [1, 2, 3], "Luzon");


async function RecoveryFunction() {
    console.log("In Recovery.....");
    // Define the path to the log file
    const logFilePath = 'database_log.json';

    // Read the contents of the log file
    fs.readFile(logFilePath, 'utf8', (err, content) => {
        if (err) {
            console.error('Error reading log file:', err);
            return;
        }
        
        try {
            // Parse the JSON content
            const logs = JSON.parse(content);

            // Print each object in the JSON array
            logs.forEach(async (log, index) => {
                // console.log(`Log ${index + 1}:`);
                // console.log(`SQL: ${log.sql}`);
                // console.log(`Values:`, log.values);
                // console.log(`Connection: ${log.connection}`);
                // console.log('-------------------------');
                try{
                    switch (log.connection) {
                        case 'CentralLuzon':
                            const resultsRecoveryWriteCentralLuzon = await new Promise((resolve, reject) => {
                                console.log("In Recovery: Writing to Central-Luzon");
                                centralToLuzonConnection.query(log.sql, log.values, (err, resultsRecoveryWriteCentralLuzon) => {
                                    if (err) {
                                        console.error('Recovery: Central-Luzon DB -> Error executing SQL query:', err);
                                        reject(err);
                                        return;
                                    }
                                    console.log("Recovery: Central-Luzon -> Write Success");
                                    resolve(resultsRecoveryWriteCentralLuzon);
                                });
                            });
                            break;
                        case 'Luzon':
                            console.log("In Recovery: Writing to Luzon");
                            const resultsRecoveryWriteLuzon = await new Promise((resolve, reject) => {
                                console.log("In Recovery: Writing to Luzon");
                                luzonConnection.query(log.sql, log.values, (err, resultsRecoveryWriteLuzon) => {
                                    if (err) {
                                        console.error('Recovery: Luzon DB -> Error executing SQL query:', err);
                                        reject(err);
                                        return;
                                    }
                                    console.log("Recovery: Luzon -> Write Success");
                                    resolve(resultsRecoveryWriteLuzon);
                                });
                            });
                            break;
                        case 'CentralVisMin':
                            console.log("In Recovery: Writing to Central-VisMin");
                            const resultsRecoveryWriteCentralVisMin = await new Promise((resolve, reject) => {
                            centralToVisMinConnection.query(log.sql, log.values, (err, resultsRecoveryWriteCentralVisMin) => {
                                if (err) {
                                    console.error('Central-VisMin DB -> Error executing SQL query:', err);
                                    reject(err);
                                    return;
                                }
                                console.log("Recovery: Central-VisMin -> Write Success");
                                resolve(resultsRecoveryWriteCentralVisMin);
                            });
                            });
                            break;
                        case 'VisMin':
                            console.log("In Recovery: Writing to VisMin");
                            const resultsRecoveryWriteVisMin = await new Promise((resolve, reject) => {
                                visMinConnection.query(sql, values, (err, resultsRecoveryWriteVisMin) => {
                                    if (err) {
                                        console.error('VisMin DB -> Error executing SQL query:', err);
                                        reject(err);
                                        return;
                                    }
                                    console.log("Recovery: VisMin -> Write Success");
                                    resolve(resultsRecoveryWriteVisMin);
                                });
                            });
                            break;
                    }
                }catch (error){
                    console.error('Error in recovery:', error);

                }
                
            });

            // Clear the contents of the log file
            fs.writeFile(logFilePath, '[]', 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Error clearing log file:', writeErr);
                    return;
                }
                console.log('Log file has been cleared successfully.');
            });
        } catch (parseErr) {
            console.error('Error parsing log file content:', parseErr);
        }
    });
}

// Call the RecoveryFunction to execute it
//RecoveryFunction();




// Example usage:
//writeToLogFile("SELECT * FROM table", [1, 2, 3], "Central");
//writeToLogFile("SELECT * FROM table", [1, 2, 3], "Luzon");
//RecoveryFunction();


// Define a function to handle database operations
async function handleDatabaseOperation(sql, values, action, db) {
    console.log("\nIn Handle Database Operations");
    if (action == "Write") {
        console.log("In Write");
        if (db == "Luzon") {
            console.log("In Write-Luzon");
            try {
                if (CentralDB_State) {
                    const resultsWriteCentralLuzon = await new Promise((resolve, reject) => {
                        console.log("In Write-Luzon: Writing to Central");
                        centralToLuzonConnection.query(sql, values, async (err, resultsWriteCentralLuzon) => {
                            if (err) {
                                console.log('Central-Luzon DB -> Error executing SQL query:', err);
                                console.log("Central-Luzon DB -> Transaction Logged");
                                await writeToLogFile(sql, values, "CentralLuzon");
                                await sleep(500);
                                reject(err);
                                return;
                            }
                            resolve(resultsWriteCentralLuzon);
                        });
                    });
                    if (resultsWriteCentralLuzon.exists) {
                        console.log("Central-Luzon DB -> Transaction Success");
                    }
                } else {
                    await writeToLogFile(sql, values, "CentralLuzon");
                    await sleep(500);
                    console.log("Central-Luzon DB -> Transaction Logged");
                }

                if (LuzonDB_State) {
                    console.log("In Write-Luzon: Writing to Luzon");
                    const resultsWriteLuzon = await new Promise((resolve, reject) => {
                        luzonConnection.query(sql, values, async (err, resultsWriteLuzon) => {
                            if (err) {
                                console.log('Luzon DB -> Error executing SQL query:', err);
                                console.log("Luzon DB -> Transaction Logged");
                                await writeToLogFile(sql, values, "Luzon");
                                await sleep(500);
                                reject(err);
                                return;
                            }
                            resolve(resultsWriteLuzon);
                        });
                    });
                    if (resultsWriteLuzon.exists) {
                        console.log("Luzon DB -> Transaction Success");
                    }
                } else {
                    await writeToLogFile(sql, values, "Luzon");
                    await sleep(500);
                    console.log("Luzon DB -> Transaction Logged");
                }

                return "Success";
            } catch (error) {
                console.error('Error during write operation:', error);
                response.status(500).json({ error: 'Internal server error' });
                return;
            }
        } else if (db == "VisMin") {
            console.log("In Write-VisMin");
            try {
                if (CentralDB_State) {
                    console.log("In Write-VisMin: Writing to Central");
                    const resultsWriteCentralVisMin = await new Promise((resolve, reject) => {
                        centralToVisMinConnection.query(sql, values, async (err, resultsWriteCentralVisMin) => {
                            if (err) {
                                console.error('Central-VisMin DB -> Error executing SQL query:', err);
                                console.log("Central-VisMin DB -> Transaction Logged");
                                await writeToLogFile(sql, values, "CentralVisMin");
                                await sleep(500);
                                reject(err);
                                return;
                            }
                            resolve(resultsWriteCentralVisMin);
                        });
                    });
                    if (resultsWriteCentralVisMin.exists) {
                        console.log("Central-VisMin DB -> Transaction Success");
                    }
                } else {
                    await writeToLogFile(sql, values, "CentralVisMin");
                    await sleep(500);
                    console.log("Central-VisMin DB -> Transaction Logged");
                }

                if (VisMinDB_State) {
                    console.log("In Write-VisMin: Writing to VisMin");
                    const resultsWriteVisMin = await new Promise((resolve, reject) => {
                        visMinConnection.query(sql, values, async (err, resultsWriteVisMin) => {
                            if (err) {
                                console.error('VisMin DB -> Error executing SQL query:', err);
                                console.log("VisMin DB -> Transaction Logged");
                                await writeToLogFile(sql, values, "VisMin");
                                await sleep(500);
                                reject(err);
                                return;
                            }
                            resolve(resultsWriteVisMin);
                        });
                    });
                    if (resultsWriteVisMin.exists) {
                        console.log("VisMin DB -> Transaction Success");
                    }
                } else {
                    await writeToLogFile(sql, values, "VisMin");
                    await sleep(500);
                    console.log("VisMin DB -> Transaction Logged");
                }

                return "Success";
            } catch (error) {
                console.error('Error during write operation:', error);
                response.status(500).json({ error: 'Internal server error' });
                return;
            }
        }
    }
    if (action == "Read") {
        console.log("In Read");
        if (db == "Luzon") {
            console.log("In Read-Luzon");
            if (CentralDB_State == true) {
                console.log("In Read-Luzon - Central");
                const resultsReadCentralLuzon = await new Promise((resolve, reject) => {
                    centralToLuzonConnection.query(sql, values, (err, resultsReadCentralLuzon) => {
                        if (err) {
                            console.error('Read Central-Luzon DB -> Error executing SQL query:', err);
                            reject(err);
                            return;
                        }
                        console.log("Central-Luzon DB -> Read Success")
                        resolve(resultsReadCentralLuzon);
                    });
                });
                return resultsReadCentralLuzon;
            } else if (LuzonDB_State == true) {
                console.log("In Read-Luzon - Luzon");
                const resultsReadLuzon = await new Promise((resolve, reject) => {
                    luzonConnection.query(sql, values, (err, resultsReadLuzon) => {
                        if (err) {
                            console.error('Read Luzon DB -> Error executing SQL query:', err);
                            reject(err);
                            return;
                        }
                        console.log("Luzon DB -> Read Success")
                        resolve(resultsReadLuzon);
                    });
                });
                return resultsReadLuzon;
            }
        }
        if (db == "VisMin") {
            console.log("In Read-VisMin");
            if (CentralDB_State == true) {
                console.log("In Read-VisMin - Central");
                const resultsReadCentralVisMin = await new Promise((resolve, reject) => {
                    centralToVisMinConnection.query(sql, values, (err, resultsReadCentralVisMin) => {
                        if (err) {
                            console.error('Read Central-VisMin DB -> Error executing SQL query:', err);
                            reject(err);
                            return;
                        }
                        console.log("Central-VisMin DB -> Read Success")
                        resolve(resultsReadCentralVisMin);
                    });
                });
                return resultsReadCentralVisMin;
            } else if (VisMinDB_State == true) {
                console.log("In Read-VisMin - VisMin");
                const resultsReadVisMin = await new Promise((resolve, reject) => {
                    visMinConnection.query(sql, values, (err, resultsReadVisMin) => {
                        if (err) {
                            console.error('Read VisMin DB -> Error executing SQL query:', err);
                            reject(err);
                            return;
                        }
                        console.log("VisMin DB -> Read Success")
                        resolve(resultsReadVisMin);
                    });
                });
                return resultsReadVisMin;
            }
        }
    }
}



/*------------ HBS Functions-----------*/
// Set Handlebars as the view engine
app.engine('hbs', exphbs.create({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views')
}).engine);

app.set('view engine', 'hbs');

// Set the path to the views folder
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));


/*------------ HBS Functions-----------*/
// Define routes
app.get('/getDB_Status', (req, res) => {
    const dbStatus = {
        VisMinDB_State: VisMinDB_State,
        CentralDB_State: CentralDB_State,
        LuzonDB_State: LuzonDB_State
    };
    console.log("DB Status: "+dbStatus);
    console.log("VisMinDB_State: "+dbStatus.VisMinDB_State);
    console.log("CentralDB_State: "+dbStatus.CentralDB_State);
    console.log("LuzonDB_State: "+dbStatus.LuzonDB_State);
    res.json(dbStatus);
});


app.get('/', async (req, res) => {
    let appointmentsFromLuzon, appointmentsFromVisMin;
    // Query first 50 appointments from Luzon database
    query = 'SELECT * FROM DenormalizedAppointments LIMIT 50';

    if(VisMinDB_State == true || CentralDB_State == true){
        appointmentsFromVisMin = await handleDatabaseOperation(query, [], "Read", "VisMin");
        //console.log("appointmentsFromVisMin: "+appointmentsFromVisMin);
    }
    if(LuzonDB_State == true || CentralDB_State == true){
        appointmentsFromLuzon = await handleDatabaseOperation(query, [], "Read", "Luzon");
        //console.log("appointmentsFromLuzon: "+appointmentsFromLuzon);
    }
    
    const combinedAppointments = [...appointmentsFromLuzon, ...appointmentsFromVisMin];
    res.render('main', { appointments: combinedAppointments });
});


// Route to handle lost connection
app.get('/lostConnection', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'lost_connection.html'));
});

// Route to handle opening connection again
app.get('/openConnection', (req, res) => {
    console.log("Gained Connection To Server");
    res.redirect('/'); // Redirect back to the main page
});



// Route to get distinct values for a filter
app.get('/getDistinctValues', async (req, res) => {
    console.log("In Get Distinct Values");
    const filter = req.query.filter;
    //console.log("Filter: " +filter);

    let resultsLuzon = [];
    let resultsVisMin = [];
    const sql = `SELECT DISTINCT ${filter} FROM DenormalizedAppointments LIMIT 50`;
    if(VisMinDB_State == true || CentralDB_State == true){
        resultsLuzon = await handleDatabaseOperation(sql, [], "Read", "VisMin");
        //console.log("appointmentsFromVisMin: "+appointmentsFromVisMin);
    }
    if(LuzonDB_State == true || CentralDB_State == true){
        resultsVisMin = await handleDatabaseOperation(sql, [], "Read", "Luzon");
        //console.log("appointmentsFromLuzon: "+appointmentsFromLuzon);
    }
    const valuesLuzon = resultsLuzon.map(result => result[filter]);
    const valuesVisMin = resultsVisMin.map(result => result[filter]);
    const combinedValues = [...valuesLuzon, ...valuesVisMin];
    res.json(combinedValues);
});

// Route to filter appointments
app.get('/filterAppointments', async(req, res) => {
    console.log("In Filter Appointments");
    const filter = req.query.filter;
    const value = req.query.value;
    const sql = `SELECT * FROM DenormalizedAppointments WHERE ${filter} = ? LIMIT 50`;
    let fAresultsLuzon = [];
    let fAresultsVisMin = [];
    if(VisMinDB_State == true || CentralDB_State == true){
        fAresultsLuzon = await handleDatabaseOperation(sql, [value], "Read", "VisMin");
        //console.log("appointmentsFromVisMin: "+appointmentsFromVisMin);
    }
    if(LuzonDB_State == true || CentralDB_State == true){
        fAresultsVisMin = await handleDatabaseOperation(sql, [value], "Read", "Luzon");
        //console.log("appointmentsFromLuzon: "+appointmentsFromLuzon);
    }
    const appointments = [...fAresultsLuzon, ...fAresultsVisMin];
    res.json(appointments);
});

// Endpoint to check if apptid exists
app.get('/checkApptid', async(req, res) => {
    //console.log("in /checkApptid");
    const apptid = req.query.apptid.toUpperCase(); // Convert to uppercase
    const region = req.query.region
    const query = `SELECT COUNT(*) AS count FROM DenormalizedAppointments WHERE apptid = ?`;

    let chekAppIdResults = [];
    if (region === 'Luzon') {
        console.log("Check App Id Luzon");
        chekAppIdResults = await handleDatabaseOperation(query, [apptid], "Read", "Luzon");
    } else {
        console.log("Check App Id VisMin");
        chekAppIdResults = await handleDatabaseOperation(query, [apptid], "Read", "VisMin");
    }
    const apptidExists = chekAppIdResults[0].count > 0;
    res.json({ exists: apptidExists });
});

// Endpoint to add appointment data to the database
app.post('/addAppointment', async (req, res) => {
    const { add_pxid, add_clinicid, add_doctorid, add_status, add_QueueDate, add_app_type, add_is_Virtual, add_RegionName } = req.body;
    let addAppResults;
    try {
        // Generate apptid
        const apptid = await generateApptId(add_RegionName);
        const query = 'INSERT INTO DenormalizedAppointments (pxid, clinicid, apptid, doctorid, app_type, is_virtual, status, QueueDate, StartTime, EndTime, RegionName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)';
        const values = [add_pxid, add_clinicid, apptid, add_doctorid, add_app_type, add_is_Virtual, add_status, add_QueueDate, add_RegionName];
        
        
        // Select connection based on add_RegionName
        if (add_RegionName === 'Central Luzon (III)' || add_RegionName === 'National Capital Region' || add_RegionName === 'National Capital Region (NCR)' || add_RegionName === 'Bicol Region (V)' || add_RegionName === 'MIMAROPA (IV-B)' || add_RegionName === 'CALABARZON (IV-A)' || add_RegionName === 'Ilocos Region (I)' || add_RegionName === 'Cordillera Administrative Region (CAR)' || add_RegionName === 'Cagayan Valley (II)') {
            //console.log("add Going to Luzon");
            console.log("Add Luzon");
            addAppResults = await handleDatabaseOperation(query, values, "Write", "Luzon");
        } else {
            console.log("Add VisMin");
            addAppResults = await handleDatabaseOperation(query, values, "Write", "VisMin");
        }
        console.log("Add Result: " + addAppResults);
        res.json({success: addAppResults});
    } catch (error) {
        console.error('Error generating apptid:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Endpoint to add appointment data to the database
app.post('/updateAppointment', async (req, res) => {
    const { update_apptid, update_status, update_StartTime, update_EndTime, update_app_type, update_is_Virtual, update_region} = req.body;
    let updAppResults;
    try {
        // Check if update_EndTime or update_StartTime are empty, use NULL instead
        const values = [update_status, update_StartTime || null, update_EndTime || null, update_app_type, update_is_Virtual, update_apptid];
        console.log('Values before adding: ' + values);
        const query = 'UPDATE DenormalizedAppointments SET status = ?, StartTime = ?, EndTime = ?, app_type = ?, is_Virtual = ? WHERE apptid = ?';
        // Select connection based on add_RegionName
        if (update_region === 'Luzon') {
            updAppResults = await handleDatabaseOperation(query, values, "Write", "Luzon");
        } else {
            updAppResults = await handleDatabaseOperation(query, values, "Write", "VisMin");
        }
        console.log("Update Result: " + updAppResults);
        res.json({success: updAppResults});
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to add appointment data to the database
app.post('/deleteAppointment', async (req, res) => {
    const { delete_apptid, delete_region } = req.body;
    const query = 'DELETE FROM DenormalizedAppointments WHERE apptid = ?';
    values = delete_apptid;
    let delAppResults
    // Select connection based on add_RegionName
    // let connection;
    // if (delete_region === 'Luzon') {
    //     //console.log("delete Going to Luzon");
    //     connection = centralToLuzonConnection;
    //     connection = luzonConnection; //bev
    // } else {
    //     //console.log("delete Going to vismin");
    //     connection = centralToVisMinConnection;
    //     connection = visMinConnection; //bev
    // }

    try {
        if (delete_region === 'Luzon') {
            delAppResults = await handleDatabaseOperation(query, values, "Write", "Luzon");
        } else {
            delAppResults = await handleDatabaseOperation(query, values, "Write", "VisMin");
        }
        console.log("Delete Result: " + delAppResults);
        res.json({success: delAppResults});
        // Update the appointment data in the database
        // connection.query(query, values, (error, results) => {
        //     if (error) {
        //         console.error('Error updating appointment:', error);
        //         res.status(500).json({ error: 'Internal server error' });
        //         return;
        //     }

        //     // Respond with success message or updated ID
        //     res.json({ success: true});
        // });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to retrieve appointment data based on apptid
app.get('/getAppointmentData', async (req, res) => {
    //console.log("in /getAppointmentData");
    const { apptid, region } = req.query;
    const query = 'SELECT * FROM DenormalizedAppointments WHERE apptid = ?';
    let values = apptid
    try{
        if (region === 'Luzon') {
                getAppResults = await handleDatabaseOperation(query, values, "Read", "Luzon");
            } else {
                getAppResults = await handleDatabaseOperation(query, values, "Read", "VisMin");
            }  
        if (getAppResults.length > 0) {
            const appointmentData = getAppResults[0];
            //console.log("appointmentData: ", appointmentData);
            res.json(appointmentData);
        } else {
            //console.log("Appointment data not found");
            res.status(404).json({ error: 'Appointment data not found' });
        }
    }catch (error) {
        console.error('Error getting appointment data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to generate report
app.get('/generateReport', async (req, res) => {
    const { type, region } = req.query;
    //console.log("In generate report: " + type);
    let sqlQuery = '';
    let repAppResults;

    try{
        if (type === 'total_app_type') {
            sqlQuery = `SELECT app_type, COUNT(*) AS total_count FROM DenormalizedAppointments GROUP BY app_type ORDER BY total_count DESC`;
        } else if (type === 'clinic_performance') {
            sqlQuery = `SELECT clinicid, COUNT(*) AS total_count FROM DenormalizedAppointments GROUP BY clinicid ORDER BY total_count DESC`;
        } else {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        let connection;
        if (region === 'Luzon') {
            console.log("report Going to Luzon");
            repAppResults = await handleDatabaseOperation(sqlQuery, [], "Read", "Luzon");
        } else {
            console.log("report Going to Vismin");
            repAppResults = await handleDatabaseOperation(sqlQuery, [], "Read", "VisMin");
        }
        res.json(repAppResults);
    }catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Function to generate apptid with the specified pattern
function generateApptId(add_RegionName) {
    return new Promise((resolve, reject) => {
        const prefix = '000CAFE';
        const hexRegex = /[0-9A-F]+/g;

        // Find the biggest apptid with the specified pattern
        const query = 'SELECT MAX(apptid) AS maxApptid FROM DenormalizedAppointments WHERE apptid LIKE ?';
        const pattern = prefix + '%';

        // Select connection based on add_RegionName
        let connection;
        if (add_RegionName === 'Central Luzon (III)' || add_RegionName === 'National Capital Region' || add_RegionName === 'National Capital Region (NCR)' || add_RegionName === 'Bicol Region (V)' || add_RegionName === 'MIMAROPA (IV-B)' || add_RegionName === 'CALABARZON (IV-A)' || add_RegionName === 'Ilocos Region (I)' || add_RegionName === 'Cordillera Administrative Region (CAR)' || add_RegionName === 'Cagayan Valley (II)') {
            connection = centralToLuzonConnection;
            connection = luzonConnection; //bev
        } else {
            connection = centralToVisMinConnection;
            connection = visMinConnection; //bev
        }

        connection.query(query, [pattern], (error, results) => {
            if (error) {
                console.error('Error fetching max apptid:', error);
                reject(error); // Reject the Promise on error
                return;
            }

            let nextHexValue = '00'; // Default value if no existing apptid found
            let newApptId = prefix + nextHexValue;
            if (results[0].maxApptid) {
                // Extract the hex part from the max apptid
                const match = results[0].maxApptid.match(hexRegex);
                if (match) {
                    // Increment the hex part by 1
                    const maxHex = match[0]; // Use the first match
                    const newHexValue = (parseInt(maxHex, 16) + 1).toString(16).toUpperCase().padStart(2, '0');
                    nextHexValue = newHexValue;
                    newApptId = '000'+nextHexValue;
                }
            }
            // Construct the new apptid
            //console.log('newApptId = ' + newApptId);
            resolve(newApptId); // Resolve the Promise with the new apptid
        });
    });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
