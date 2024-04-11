// script.js

// Handle change in action radio buttons
const actionRadios = document.querySelectorAll('input[name="action"]');
const appointmentForm = document.getElementById('add-appointment-form');
const addSubmitMessage = document.querySelector('.add-submit-message');
const updateSubmitMessage = document.querySelector('.update-submit-message');
const deleteSubmitMessage = document.querySelector('.delete-submit-message');

actionRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        const selectedAction = document.querySelector('input[name="action"]:checked').value;

        // Hide all form elements initially
        document.querySelectorAll('.form-element').forEach(element => {
            element.style.display = 'none';
        });
        document.querySelectorAll('.submes').forEach(element => {
            element.textContent = '';
        });
        //Clear all

        // Show specific form elements based on the selected action
        if (selectedAction === 'add') {
            document.querySelectorAll('.add-element').forEach(element => {
                element.style.display = 'block';
            });
        } else if (selectedAction === 'update') {
            document.querySelectorAll('.update-element').forEach(element => {
                element.style.display = 'block';
            });
        } else if (selectedAction === 'delete') {
            document.querySelectorAll('.delete-element').forEach(element => {
                element.style.display = 'block';
            });
        } else if (selectedAction === 'report') {
            document.querySelectorAll('.report-element').forEach(element => {
                element.style.display = 'block';
            });
            // Clear contents of report-result div
            document.querySelector('.report-result').innerHTML = '';
        }
    });
});

// Initially, show elements for adding appointment
document.querySelectorAll('.add-element').forEach(element => {
    element.style.display = 'block';
});
