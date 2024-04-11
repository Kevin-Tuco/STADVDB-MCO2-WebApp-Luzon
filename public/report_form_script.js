// Function to handle form submission
document.getElementById('report-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission
    const reportType = document.getElementById('report_type').value;

    // Make a fetch request to retrieve report data based on the selected report type
    fetch(`/generateReport?type=${reportType}`)
        .then(response => response.json())
        .then(data => {
            // Process the received report data and display it in the report-hide div
            displayReport(data, reportType); // Pass report type to the displayReport function
        })
        .catch(error => {
            console.error('Error generating report:', error);
            // Display error message if report generation fails
            displayReportError();
        });
});


// Function to display the generated report in the report-hide div
function displayReport(reportData, type) {
    const reportHideDiv = document.querySelector('.report-result');
    
    // Clear any existing content in the report-hide div
    reportHideDiv.innerHTML = '';

    // Create a table to display the report data
    const table = document.createElement('table');
    table.classList.add('table');

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    let headers = [];
    if (type === 'total_app_type') {
        headers = ['App Type', 'Total Count'];
    } else if (type === 'clinic_performance') {
        headers = ['Clinic', 'Total Count'];
    }
    headers.forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText;
        headerRow.appendChild(headerCell);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    reportData.forEach(reportEntry => {
        const row = document.createElement('tr');
        const cell1 = document.createElement('td');
        const cell2 = document.createElement('td');
        if (type === 'total_app_type') {
            cell1.textContent = reportEntry.app_type;
            cell2.textContent = reportEntry.total_count;
        } else if (type === 'clinic_performance') {
            cell1.textContent = reportEntry.clinicid;
            cell2.textContent = reportEntry.total_count;
        }
        row.appendChild(cell1);
        row.appendChild(cell2);
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Append the table to the report-hide div
    reportHideDiv.appendChild(table);
}


// Function to display an error message in the report-hide div
function displayReportError() {
    const reportHideDiv = document.querySelector('.report-result');
    reportHideDiv.innerHTML = '<p>Error generating report. Please try again later.</p>';
}
