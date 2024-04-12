const closeCentralBtn = document.getElementById('close-Central-Btn');
const closeVisMinBtn = document.getElementById('close-VisMin-Btn');
const closeLuzonBtn = document.getElementById('close-Luzon-Btn');

const openCentralBtn = document.getElementById('open-Central-Btn');
const openVisMinBtn = document.getElementById('open-VisMin-Btn');
const openLuzonBtn = document.getElementById('open-Luzon-Btn');

const mainBody = document.querySelector('.main-body');
const lostConnection = document.querySelector('.lost-connection');

const conBtns = document.querySelectorAll('.btnCon');

// Hide all open connection buttons initially
const openButtons = document.querySelectorAll('.btn-success');
openButtons.forEach(button => {
    button.style.display = 'none';
});

// Add event listeners to close buttons
const closeButtons = document.querySelectorAll('.btn-danger');
closeButtons.forEach(button => {
    button.style.display = '';
});

conBtns.forEach(button => {
    button.addEventListener('click', function() {
        // Call the corresponding function based on the button
        const connectionType = button.parentElement.classList[1]; // Get the class name
        switch (connectionType) {
            case 'open-central':
                openCentralBtn.style.display = 'none';
                closeCentralBtn.style.display = '';
                openConnectionToCentral();
                break;
            case 'open-vismin':
                openVisMinBtn.style.display = 'none';
                closeVisMinBtn.style.display = '';
                openConnectionToVisMin();
                break;
            case 'open-luzon':
                openLuzonBtn.style.display = 'none';
                closeLuzonBtn.style.display = '';
                openConnectionToLuzon();
                break;
            case 'close-central':
                openCentralBtn.style.display = '';
                closeCentralBtn.style.display = 'none';
                closeConnectionToCentral();
                break;
            case 'close-vismin':
                openVisMinBtn.style.display = '';
                closeVisMinBtn.style.display = 'none';
                closeConnectionToVisMin();
                break;
            case 'close-luzon':
                openLuzonBtn.style.display = '';
                closeLuzonBtn.style.display = 'none';
                closeConnectionToLuzon();
                break;
            default:
                console.error('Invalid connection type');
        }

        // Check if all open buttons are hidden
        const allCloseButtonsHidden = [...closeButtons].every(button => button.style.display === 'none');
        if (allCloseButtonsHidden) {
            mainBody.style.display = 'none';
            lostConnection.style.display = 'block';
        } else {
            mainBody.style.display = 'flex';
            lostConnection.style.display = 'none';
        }
    });
});

function closeConnectionToCentral() {
    // Perform actions to close connection to Central
    sendRequest('closeConnectionToCentral');
}

function closeConnectionToVisMin() {
    // Perform actions to close connection to VisMin
    sendRequest('closeConnectionToVisMin');
}

function closeConnectionToLuzon() {
    // Perform actions to close connection to Luzon
    sendRequest('closeConnectionToLuzon');
}

function openConnectionToCentral() {
    // Perform actions to open connection to Central
    sendRequest('openConnectionToCentral');
}

function openConnectionToVisMin() {
    // Perform actions to open connection to VisMin
    sendRequest('openConnectionToVisMin');
}

function openConnectionToLuzon() {
    // Perform actions to open connection to Luzon
    sendRequest('openConnectionToLuzon');
}

function sendRequest(action) {
    // Send an AJAX request to the server
    fetch(`/dbChange?action=${action}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data); // You can handle the response data here
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}
