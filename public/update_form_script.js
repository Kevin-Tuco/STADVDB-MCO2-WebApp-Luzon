// Function to force input to uppercase
function forceUppercase(input) {
    input.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
}

// Function to hide inputs other than apptid
function hideInputs() {
    const inputsToHide = document.querySelectorAll('.update-element .update-hide');
    inputsToHide.forEach(input => {
        input.style.display = 'none';
    });
}

// Function to show inputs other than apptid
function showInputs() {
    const inputsToShow = document.querySelectorAll('.update-element .update-hide');
    inputsToShow.forEach(input => {
        input.style.display = 'block';
    });
}

// Hide inputs other than apptid on page load
hideInputs();


// Select the apptid input field
const apptidInput = document.getElementById('update_apptid');
const regionInput = document.getElementById('update_region');
const update_submitButton = document.querySelector('.submit-update');

// Function to disable the submit button
function disableSubmitButton() {
    update_submitButton.disabled = true;
}

// Function to enable the submit button
function enableSubmitButton() {
    update_submitButton.disabled = false;
}

// Add event listener to apptid input
apptidInput.addEventListener('input', function() {
    // Call fetchAppointmentData with the input value
    let result = checkApptid(this.value);
    if (result = 2){
        fetchAppointmentData(this.value);
    }
    
});


function checkApptid() {
    const apptidValue = apptidInput.value.toUpperCase();
    const regionValue = regionInput.value
    let result = 0;
    let dbAvail;
    const errorDiv = document.querySelector('.update_apptid-error');

    // Clear the error message if the input is empty
    if (!apptidValue) {
        const errorDiv = document.querySelector('.update_apptid-error');
        errorDiv.textContent = '';
        return;
    }
    fetch('/getDB_Status')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            dbAvail = data;
            console.log(data); // This will log an object containing the states of your databases
            // You can access the values using dot notation, e.g., data.CentralDB_State
            //Check if the dbs allows to search
            if(regionValue === "Luzon"){
                if(dbAvail.CentralDB_State == false && dbAvail.LuzonDB_State == false){
                    errorDiv.textContent = 'Luzon Database Not Reachable';
                    return
                }
                else{
                    // Call an API endpoint to check if apptid exists in the database
                    fetch(`/checkApptid?apptid=${apptidValue}&region=${regionValue}`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.exists) {
                            disableSubmitButton();
                            errorDiv.textContent = 'apptid not found';
                            hideInputs();
                            result = 1;
                            return result;
                        } else {
                            enableSubmitButton();
                            errorDiv.textContent = '';
                            showInputs();
                            result = 2;
                            return result;
                        }
                    })
                    .catch(error => {
                        console.error('Error checking apptid:', error);
                    });
                }
                
            }else if (regionValue === "VisMin"){
                if(dbAvail.CentralDB_State == false && dbAvail.VisMinDB_State == false){
                    errorDiv.textContent = 'VisMin Database Not Reachable';
                    return
                }
                else{
                    // Call an API endpoint to check if apptid exists in the database
                    fetch(`/checkApptid?apptid=${apptidValue}&region=${regionValue}`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.exists) {
                            disableSubmitButton();
                            errorDiv.textContent = 'apptid not found';
                            hideInputs();
                            result = 1;
                            return result;
                        } else {
                            enableSubmitButton();
                            errorDiv.textContent = '';
                            showInputs();
                            result = 2;
                            return result;
                        }
                    })
                    .catch(error => {
                        console.error('Error checking apptid:', error);
                    });
                }
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


// Function to fetch appointment data based on apptid
function fetchAppointmentData(apptid) {
    // Make a fetch request to retrieve appointment data
    const regionValue = regionInput.value
    fetch(`/getAppointmentData?apptid=${apptid}&region=${regionValue}`)
        .then(response => response.json())
        .then(data => {
            // Populate form inputs with fetched data
            document.getElementById('update_pxid').value = data.pxid || '';
            document.getElementById('update_clinicid').value = data.clinicid || '';
            document.getElementById('update_doctorid').value = data.doctorid || ''; // Fix: Use doctorid instead of clinicid
            document.getElementById('update_status').value = data.status || '';
            document.getElementById('update_RegionName').value = data.RegionName || '';
            document.getElementById('update_apptid-val').textContent = 'Appointment Id: ' + data.apptid;
            document.getElementById('update_pxid-val').textContent = 'Patient Id: ' + data.pxid;
            document.getElementById('update_clinicid-val').textContent = 'Clinic Id: ' + data.clinicid;
            document.getElementById('update_doctorid-val').textContent = 'Doctor Id: ' + data.doctorid;
            document.getElementById('update_status-val').textContent = 'Status: ' + data.status;
            document.getElementById('update_TimeQueued-val').textContent = 'Time Queued: ' + data.TimeQueued;
            document.getElementById('update_QueueDate-val').textContent = 'Queue Date: ' + data.QueueDate;
            document.getElementById('update_StartTime-val').textContent = 'Start Time: ' + data.StartTime;
            document.getElementById('update_EndTime-val').textContent = 'End Time: ' + data.EndTime;
            document.getElementById('update_app_type-val').textContent = 'Appointment Type: ' + data.app_type;
            document.getElementById('update_is_Virtual-val').textContent = 'Is Virtual: ' + data.is_Virtual;
            document.getElementById('update_RegionName-val').textContent = 'Region: ' + data.RegionName;
        })
        .catch(error => {
            console.error('Error fetching appointment data:', error);
        });
}

// Handle form submission
const update_form = document.getElementById('update-appointment-form');
const update_submitMessage = document.querySelector('.update-submit-message');

update_form.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(update_form);
    const appointmentData = Object.fromEntries(formData.entries());

    // Make a POST request to send the form data to the server
    fetch('/updateAppointment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Handle successful form submission
        console.log('Form submission successful:', data.success);
        update_form.reset(); // Clear the form
        update_submitMessage.textContent = 'Appointment updated successfully!';
    })
    .catch(error => {
        // Handle errors
        console.error('Error submitting form:', error);
        update_submitMessage.textContent = 'Error updated appointment. Please try again.';
    });
});