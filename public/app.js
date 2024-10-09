document.addEventListener('DOMContentLoaded', function() {
    // Load initial data when the page loads
    loadTransactions();
    fetchStatistics();
    fetchBarChartData();
    fetchPieChartData();

    // Re-fetch data when month changes
    document.getElementById('month-select').addEventListener('change', function() {
        loadTransactions();
        fetchStatistics();
        fetchBarChartData();
        fetchPieChartData();
    });

    // Search button functionality
    document.getElementById('search-button').addEventListener('click', function() {
        loadTransactions(); // Load transactions based on search
    });

    // Allow search on "Enter" key
    document.getElementById('search-box').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            loadTransactions(); // Load transactions based on search
        }
    });

    // Pagination buttons
    document.getElementById('previous-button').addEventListener('click', loadPreviousPage);
    document.getElementById('next-button').addEventListener('click', loadNextPage);
});

let currentPage = 1;
const perPage = 10;

// Fetch and display transactions
async function fetchTransactions(searchQuery = '', page = 1, month = '03') {
    try {
        const response = await fetch(`http://localhost:5000/api/transactions/search?month=${month}&page=${page}&perPage=${perPage}&search=${searchQuery}`);
        if (!response.ok) {
            throw new Error(`Error fetching transactions: ${response.statusText}`);
        }
        const data = await response.json();
        displayTransactions(data.transactions); 
        currentPage = page; // Update current page
        document.getElementById('current-page').textContent = currentPage; // Update the current page number
    } catch (error) {
        console.error(error);
    }
}


function displayTransactions(transactions) {
    const tableBody = document.querySelector('#transaction-table tbody');
    tableBody.innerHTML = ''; // Clear previous data
    transactions.forEach(transaction => {
        const row = `<tr>
            <td>${transaction.title}</td>
            <td>${transaction.description}</td>
            <td>${transaction.price}</td>
            <td>${transaction.sold ? 'Yes' : 'No'}</td>
            <td>${new Date(transaction.dateOfSale).toLocaleDateString()}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// Fetch and display statistics
async function fetchStatistics(month = '03') {
    try {
        const response = await fetch(`http://localhost:5000/api/statistics?month=${month}`);
        if (!response.ok) {
            throw new Error(`Error fetching statistics: ${response.statusText}`);
        }
        const stats = await response.json();
        displayStatistics(stats);
    } catch (error) {
        console.error(error);
    }
}

function displayStatistics(stats) {
    document.querySelector('#total-sale').textContent = `Total Sale: $${stats.totalSale}`;
    document.querySelector('#sold-items').textContent = `Sold Items: ${stats.totalSold}`;
    document.querySelector('#not-sold-items').textContent = `Not Sold Items: ${stats.totalNotSold}`;
}

// Fetch and display bar chart data
async function fetchBarChartData(month = '03') {
    try {
        const response = await fetch(`http://localhost:5000/api/chart/bar?month=${month}`);
        if (!response.ok) {
            throw new Error(`Error fetching bar chart data: ${response.statusText}`);
        }
        const chartData = await response.json();
        displayBarChart(chartData);
    } catch (error) {
        console.error(error);
    }
}

function displayBarChart(data) {
    const ctx = document.getElementById('barChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.priceRanges,
            datasets: [{
                label: 'Items',
                data: data.itemCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Fetch and display pie chart data
async function fetchPieChartData(month = '03') {
    try {
        const response = await fetch(`http://localhost:5000/api/chart/pie?month=${month}`);
        if (!response.ok) {
            throw new Error(`Error fetching pie chart data: ${response.statusText}`);
        }
        const pieData = await response.json();
        displayPieChart(pieData);
    } catch (error) {
        console.error(error);
    }
}

function displayPieChart(data) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.categories,
            datasets: [{
                label: 'Items',
                data: data.itemCounts,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1
            }]
        }
    });
}

function loadTransactions() {
    const searchQuery = document.getElementById('search-box').value;
    const selectedMonth = document.getElementById('month-select').value;
    fetchTransactions(searchQuery, currentPage, selectedMonth);
}

function loadPreviousPage() {
    if (currentPage > 1) {
        fetchTransactions(document.getElementById('search-box').value, currentPage - 1);
    }
}

function loadNextPage() {
    fetchTransactions(document.getElementById('search-box').value, currentPage + 1);
}
