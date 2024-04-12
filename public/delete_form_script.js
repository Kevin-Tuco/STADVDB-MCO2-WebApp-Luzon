const delete_apptidInput = document.getElementById('delete_apptid');
// Add event listener to apptid input
delete_apptidInput.addEventListener('input', function() {
    // Call fetchAppointmentData with the input value
    let result = delete_checkApptid(this.value);
    if (result = 2){
        deleteFetchAppointmentData(this.value);
    }
    
});

// Function to hide inputs other than apptid
function del_hideInputs() {
    const inputsToHide = document.querySelectorAll('.delete-element .delete-hide');
    inputsToHide.forEach(input => {
        input.style.display = 'none';
    });
}

// Function to show inputs other than apptid
function del_showInputs() {
    const inputsToShow = document.querySelectorAll('.delete-element .delete-hide');
    inputsToShow.forEach(input => {
        input.style.display = 'block';
    });
}

//Function to check if the apptid is valid
function delete_checkApptid() {
    const apptidValue = delete_apptidInput.value.toUpperCase();
    const regionValue = delete_regionInput.value
    let result = 0;
    let del_dbAvail;
    const delerrorDiv = document.querySelector('.delete_apptid-error');
    // Clear the error message if the input is empty
    if (!apptidValue) {
        //const errorDiv = document.querySelector('.delete_apptid-error');
        delerrorDiv.textContent = '';
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
            del_dbAvail = data;
            console.log(data); // This will log an object containing the states of your databases
            // You can access the values using dot notation, e.g., data.CentralDB_State
            //Check if the dbs allows to search
            if(regionValue === "Luzon"){
                if(del_dbAvail.CentralDB_State == false && del_dbAvail.LuzonDB_State == false){
                    delerrorDiv.textContent = 'Luzon Database Not Reachable';
                    return
                }
                else{
                    // Call an API endpoint to check if apptid exists in the database
                    fetch(`/checkApptid?apptid=${apptidValue}`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.exists) {
                            disableSubmitButton();
                            delerrorDiv.textContent = 'apptid not found';
                            hideInputs();
                            result = 1;
                            return result;
                        } else {
                            enableSubmitButton();
                            delerrorDiv.textContent = '';
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

function deleteFetchAppointmentData(apptid) {
    fetch(`/getAppointmentData?apptid=${apptid}`)
        .then(response => response.json())
        .then(data => {
            // Populate form inputs with fetched data
            document.getElementById('delete_apptid-val').textContent = 'Appointment Id: ' + data.apptid;
            document.getElementById('delete_pxid-val').textContent = 'Patient Id: ' + data.pxid;
            document.getElementById('delete_clinicid-val').textContent = 'Clinic Id: ' + data.clinicid;
            document.getElementById('delete_doctorid-val').textContent = 'Doctor Id: ' + data.doctorid;
            document.getElementById('delete_status-val').textContent = 'Status: ' + data.status;
            document.getElementById('delete_TimeQueued-val').textContent = 'Time Queued: ' + data.TimeQueued;
            document.getElementById('delete_QueueDate-val').textContent = 'Queue Date: ' + data.QueueDate;
            document.getElementById('delete_StartTime-val').textContent = 'Start Time: ' + data.StartTime;
            document.getElementById('delete_EndTime-val').textContent = 'End Time: ' + data.EndTime;
            document.getElementById('delete_app_type-val').textContent = 'Appointment Type: ' + data.app_type;
            document.getElementById('delete_is_Virtual-val').textContent = 'Is Virtual: ' + data.is_Virtual;
            document.getElementById('delete_RegionName-val').textContent = 'Region: ' + data.RegionName;
        })
        .catch(error => {
            console.error('Error fetching appointment data:', error);
        });
}


// Handle form submission
const delete_form = document.getElementById('delete-appointment-form');
const delete_submitMessage = document.querySelector('.delete-submit-message');

delete_form.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(delete_form);
    const appointmentData = Object.fromEntries(formData.entries());

    // Make a POST request to send the form data to the server
    fetch('/deleteAppointment', {
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
        console.log('Form submission successful:', data);
        update_form.reset(); // Clear the form
        delete_submitMessage.textContent = 'Appointment deleted successfully!';
    })
    .catch(error => {
        // Handle errors
        console.error('Error submitting form:', error);
        delete_submitMessage.textContent = 'Error deleted appointment. Please try again.';
    });
});