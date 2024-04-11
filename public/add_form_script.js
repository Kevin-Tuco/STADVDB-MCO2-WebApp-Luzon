//form_script.js

/* ---- ADD FORM ---- */
// Select the input fields
const pxidInput = document.getElementById('add_pxid');
const clinicidInput = document.getElementById('add_clinicid');
const doctoridInput = document.getElementById('add_doctorid');
const submitButton = document.querySelector('.submit-add');

// Function to disable the submit button
function disableSubmitButton() {
    submitButton.disabled = true;
}

// Function to enable the submit button
function enableSubmitButton() {
    submitButton.disabled = false;
}

// Handle form submission
const form = document.getElementById('add-appointment-form');
const submitMessage = document.querySelector('.add-submit-message');

form.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(form);
    const appointmentData = Object.fromEntries(formData.entries());

    // Make a POST request to send the form data to the server
    fetch('/addAppointment', {
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
        form.reset(); // Clear the form
        submitMessage.textContent = 'Appointment added successfully!';
    })
    .catch(error => {
        // Handle errors
        console.error('Error submitting form:', error);
        submitMessage.textContent = 'Error adding appointment. Please try again.';
    });
});
