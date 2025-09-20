// electricity.js
const electricity = {
    // Variables for pagination
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    allData: [],
    chartInstance: null, // Added for Chart.js instance

    // ELECTRICITY FUNCTIONALITY
    async loadElectricityData() {
        try {
            showElectricityLoading();
            const response = await fetch(`${API_BASE_URL}/electricity`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const electricityData = await response.json();
            this.displayElectricityData(electricityData);
            this.setupChart(electricityData); // Setup chart after data is loaded
            hideElectricityLoading();

        } catch (error) {
            console.error('Error loading electricity data:', error);
            showError('Failed to load electricity data. Please check if the server is running on port 2992.');
            hideElectricityLoading();
        }
    },

    displayElectricityData(electricityData) {
        this.allData = electricityData;
        this.totalItems = electricityData.length;

        const tableBody = document.getElementById('electricityTableBody');
        const table = document.getElementById('electricityTable');
        const pagination = document.getElementById('electricityPagination');
        
        tableBody.innerHTML = '';

        if (electricityData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No electricity readings found. Add your first reading!</td></tr>';
            pagination.classList.add('hidden');
        } else {
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = Math.min(startIndex + this.pageSize, electricityData.length);
            const pageData = electricityData.slice(startIndex, endIndex);

            pageData.forEach(reading => {
                const row = this.createElectricityRow(reading);
                tableBody.appendChild(row);
            });

            this.updatePagination();
            pagination.classList.remove('hidden');
        }

        table.classList.remove('hidden');
    },

    createElectricityRow(reading) {
        const row = document.createElement('tr');
        const consumptionClass = reading.kulutus_sahko > 0 ? 'consumption-highlight-electricity' : '';
        
        // Sanitize the description string before passing it to showDeleteModal
        const deleteDescription = escapeHtml(`${reading.kiinteisto || reading.kiinteistotunnus} - ${reading.kuukausi} ${reading.vuosi}`);

        row.innerHTML = `
            <td>${reading.kiinteisto || reading.kiinteistotunnus}</td>
            <td>${reading.osoite || '-'}</td>
            <td>${reading.vuosi}</td>
            <td>${reading.kuukausi}</td>
            <td>${new Date(reading.lukemapva).toLocaleDateString('fi-FI')}</td>
            <td>${reading.sahkolukema} kWh</td>
            <td><span class="${consumptionClass}">${reading.kulutus_sahko > 0 ? reading.kulutus_sahko + ' kWh' : '-'}</span></td>
            <td>${reading.muuta || '-'}</td>
            <td class="actions-cell">
                <button onclick="electricity.editElectricityReading(${reading.id})" class="success">✏️ Edit</button>
                <button onclick="showDeleteModal('electricity', ${reading.id}, '${reading.kiinteisto || reading.kiinteistotunnus} - ${reading.kuukausi} ${reading.vuosi}')" class="danger">🗑️ Delete</button>
            </td>
        `;
        return row;
    },

    async loadPropertiesForSelect() {
        try {
            const response = await fetch(`${API_BASE_URL}/property`);
            const properties = await response.json();

            const select = document.getElementById('electricity_kiinteistotunnus');

            select.innerHTML = '<option value="">Select Property...</option>';

            properties.forEach(property => {
                const option = document.createElement('option');
                option.value = property.kiinteistotunnus;
                option.textContent = `${property.kiinteisto || property.kiinteistotunnus} - ${property.osoite}`;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading properties for electricity select:', error);
        }
    },

    showAddElectricityForm() {
        document.getElementById('addElectricityForm').classList.remove('hidden');
        document.getElementById('electricityForm').reset();
        currentEditId = null;
        document.querySelector('#addElectricityForm h2').textContent = 'Add Electricity Reading';
        document.querySelector('#addElectricityForm button[type="submit"]').innerHTML = '💾 Save Reading';
        document.getElementById('electricity_vuosi').value = new Date().getFullYear();
    },

    hideAddElectricityForm() {
        document.getElementById('addElectricityForm').classList.add('hidden');
        document.getElementById('electricityForm').reset();
        currentEditId = null;
        // Reset form title and button text to default state
        document.querySelector('#addElectricityForm h2').textContent = 'Add Electricity Reading';
        document.querySelector('#addElectricityForm button[type="submit"]').innerHTML = '💾 Save Reading';
    },

    async editElectricityReading(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/electricity`);
            const electricityData = await response.json();
            const reading = electricityData.find(r => r.id === id);

            if (reading) {
                await this.loadPropertiesForSelect();
                document.getElementById('electricity_kiinteistotunnus').value = reading.kiinteistotunnus;
                document.getElementById('electricity_vuosi').value = reading.vuosi;
                document.getElementById('electricity_kuukausi').value = reading.kuukausi;
                document.getElementById('electricity_lukemapva').value = reading.lukemapva;
                document.getElementById('electricity_sahkolukema').value = reading.sahkolukema;
                document.getElementById('electricity_muuta').value = reading.muuta || '';

                currentEditId = id;
                document.querySelector('#addElectricityForm h2').textContent = 'Edit Electricity Reading';
                document.querySelector('#addElectricityForm button[type="submit"]').innerHTML = '✏️ Update Reading';
                document.getElementById('addElectricityForm').classList.remove('hidden');
                document.getElementById('addElectricityForm').scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error loading electricity reading for edit:', error);
            showError('Failed to load electricity reading data for editing');
        }
    },

    async handleElectricityFormSubmit() {
        const formData = new FormData(document.getElementById('electricityForm'));
        const electricityData = {};

        for (let [key, value] of formData.entries()) {
            if (key === 'sahkolukema') {
                electricityData[key] = parseFloat(value);
            } else if (key === 'vuosi') {
                electricityData[key] = parseInt(value);
            } else {
                electricityData[key] = value || null;
            }
        }

        try {
            let response;
            if (currentEditId) {
                response = await fetch(`${API_BASE_URL}/electricity/${currentEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(electricityData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/electricity`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(electricityData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save electricity reading');
            }

            showSuccess(currentEditId ? 'Electricity reading updated successfully!' : 'Electricity reading added successfully!');
            this.hideAddElectricityForm();
            this.loadElectricityData();

        } catch (error) {
            console.error('Error saving electricity reading:', error);
            showError(error.message);
        }
    },

    async exportElectricityToCsv() {
        try {
            const response = await fetch(`${API_BASE_URL}/electricity`);
            const electricityData = await response.json();

            if (electricityData.length === 0) {
                showError('No electricity data to export');
                return;
            }

            // Create CSV headers
            const headers = [
                'Property', 'Address', 'Property ID', 'Year', 'Month', 'Reading Date',
                'Electricity Reading (kWh)', 'Electricity Consumption (kWh)', 'Notes'
            ];

            // Convert data to CSV format
            const csvContent = [
                headers.join(','),
                ...electricityData.map(reading => [
                    `"${reading.kiinteisto || reading.kiinteistotunnus || ''}"`,
                    `"${reading.osoite || ''}"`,
                    `"${reading.kiinteistotunnus || ''}"`,
                    reading.vuosi || '',
                    `"${reading.kuukausi || ''}"`,
                    reading.lukemapva ? new Date(reading.lukemapva).toLocaleDateString('fi-FI') : '',
                    reading.sahkolukema || '',
                    reading.kulutus_sahko || '',
                    `"${reading.muuta || ''}"`
                ].join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `electricity_consumption_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showSuccess('Electricity consumption data exported successfully!');
        } catch (error) {
            console.error('Error exporting electricity data:', error);
            showError('Failed to export electricity consumption data');
        }
    },

    // CHART FUNCTIONALITY
    setupChart(electricityData) {
        this.populateYearSelectors(electricityData);
        this.createChart(electricityData);
    },

    populateYearSelectors(electricityData) {
        const years = [...new Set(electricityData.map(item => item.vuosi))].sort((a, b) => b - a);
        const currentYear = new Date().getFullYear();

        const yearSelect = document.getElementById('electricity-year-select');
        yearSelect.innerHTML = '';

        // Add options for each year to the multi-select dropdown
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            // Select current year by default if available, otherwise select the latest year
            if (year === currentYear || (years.length > 0 && year === years[0])) { // Select the latest year if currentYear not found
                option.selected = true;
            }
            yearSelect.appendChild(option);
        });

        // Add event listeners
        yearSelect.removeEventListener('change', this.handleChartControlChange);
        yearSelect.addEventListener('change', this.handleChartControlChange.bind(this, electricityData));

    },

    handleChartControlChange(electricityData) {
        const yearSelect = document.getElementById('electricity-year-select');
        const selectedOptions = Array.from(yearSelect.selectedOptions);
        const selectedYears = selectedOptions.map(option => parseInt(option.value));
        
        this.updateChart(electricityData, selectedYears);
    },

    createChart(electricityData) {
        const ctx = document.getElementById('electricityChart').getContext('2d');

        // Destroy existing chart if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Get initial selected years (the ones populated by populateYearSelectors)
        const yearSelect = document.getElementById('electricity-year-select');
        const selectedOptions = Array.from(yearSelect.selectedOptions);
        const selectedYears = selectedOptions.map(option => parseInt(option.value));

        const chartData = this.prepareChartData(electricityData, selectedYears);

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Electricity Consumption - ${selectedYears.length > 1 ? 'Years ' + selectedYears.join(', ') : (selectedYears[0] || 'No Year Selected')}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Consumption (kWh)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    },

    prepareChartData(electricityData, selectedYears) {
        const months = ['Tammi', 'Helmi', 'Maalis', 'Huhti', 'Touko', 'Kesä',
                       'Heinä', 'Elo', 'Syys', 'Loka', 'Marras', 'Joulu'];
        const datasets = [];
//        const showFlow = document.getElementById('showFlowConsumption').checked;

        // Define a set of consistent colors for years
        const colors = [
            'rgba(255, 99, 132, 0.6)', // Red
            'rgba(54, 162, 235, 0.6)', // Blue
            'rgba(255, 206, 86, 0.6)', // Yellow
            'rgba(75, 192, 192, 0.6)', // Green
            'rgba(153, 102, 255, 0.6)',// Purple
            'rgba(255, 159, 64, 0.6)', // Orange
            'rgba(199, 199, 199, 0.6)',// Grey
            'rgba(83, 102, 134, 0.6)', // Dark Blue Grey
            'rgba(110, 203, 110, 0.6)',// Light Green
            'rgba(200, 50, 50, 0.6)',  // Dark Red
        ];
        const borderColors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 134, 1)',
            'rgba(110, 203, 110, 1)',
            'rgba(200, 50, 50, 1)',
        ];

        selectedYears.sort((a, b) => a - b); // Sort years for consistent color assignment

        selectedYears.forEach((year, index) => {
            const yearData = this.getYearlyData(electricityData, year, months);
            const colorIndex = index % colors.length; // Cycle through colors

            datasets.push({
                label: `${year} - Electricity (kWh)`,
                data: yearData.electricity,
                backgroundColor: colors[colorIndex],
                borderColor: borderColors[colorIndex],
                borderWidth: 1,
                // Add a unique ID to distinguish electricity/flow for a given year if needed for complex interactions
                // type: 'bar' // Explicitly set type if mixing types later
            });
        });

        return {
            labels: months,
            datasets: datasets
        };
    },

    getYearlyData(electricityData, year, months) {
        const electricityConsumption = new Array(12).fill(0);

        // Filter data for the specific year and aggregate by month
        const yearData = electricityData.filter(item => item.vuosi === year);

        yearData.forEach(item => {
            // Find month index using item.kuukausi (e.g., "Tammi") against the months array
            // Note: Your data uses Finnish month names. Ensure they match the 'months' array.
            const monthIndex = months.indexOf(item.kuukausi);
            if (monthIndex !== -1) {
                electricityConsumption[monthIndex] += item.kulutus_sahko || 0;
            }
        });

        return {
            electricity: electricityConsumption,
        };
    },

    updateChart(electricityData, selectedYears) {
        if (!this.chartInstance) return;

        // Update chart title based on selected years
        const titleText = selectedYears.length > 0
            ? `Electricity Consumption - Years: ${selectedYears.join(', ')}`
            : 'Electricity Consumption';

        this.chartInstance.options.plugins.title.text = titleText;

        const newData = this.prepareChartData(electricityData, selectedYears);
        this.chartInstance.data = newData;
        this.chartInstance.update();
    },

    // PAGINATION FUNCTIONS
    updatePagination() {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        const startItem = (this.currentPage - 1) * this.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.pageSize, this.totalItems);

        const currentRangeSpan = document.getElementById('electricityCurrentRange');
        const totalItemsSpan = document.getElementById('electricityTotalItems');
        const prevBtn = document.getElementById('electricityPrevBtn');
        const nextBtn = document.getElementById('electricityNextBtn');
        const pageNumbersDiv = document.getElementById('electricityPageNumbers');
        const pageSizeSelect = document.getElementById('electricityPageSize');

        if (!currentRangeSpan || !totalItemsSpan || !prevBtn || !nextBtn || !pageNumbersDiv || !pageSizeSelect) {
            console.error('Error: Missing pagination elements for electricity.');
            return;
        }

        currentRangeSpan.textContent = `${startItem}-${endItem}`;
        totalItemsSpan.textContent = this.totalItems;

        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;

        this.updatePageNumbers(totalPages);
    },

    updatePageNumbers(totalPages) {
        const pageNumbers = document.getElementById('electricityPageNumbers'); // Corrected ID
        if (!pageNumbers) {
            console.error('Error: electricityPageNumbers element not found.');
            return;
        }
        let html = '';

        for (let i = 1; i <= totalPages; i++) {
            // Logic for pagination buttons (first, last, current +/- 2, ellipsis)
            if (i === this.currentPage) {
                html += `<button class="page-number active" onclick="electricity.goToPage(${i})">${i}</button>`;
            } else if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `<button class="page-number" onclick="electricity.goToPage(${i})">${i}</button>`;
            } else if (
                (i === this.currentPage - 3 && this.currentPage - 3 > 1) || 
                (i === this.currentPage + 3 && this.currentPage + 3 < totalPages)
            ) {
                html += '<span class="page-ellipsis">...</span>';
            }
        }

        pageNumbers.innerHTML = html;
    },

    changePage(direction) {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.currentPage = Math.max(1, Math.min(totalPages, this.currentPage + direction));
        this.displayElectricityData(this.allData);
    },

    goToPage(page) {
        this.currentPage = page;
        this.displayElectricityData(this.allData);
    },

    changePageSize() {
        const pageSizeSelect = document.getElementById('electricityPageSize');
        if (!pageSizeSelect) {
            console.error('Error: electricityPageSize element not found.');
            return;
        }
        this.pageSize = parseInt(pageSizeSelect.value); // Corrected ID
        this.currentPage = 1;
        this.displayElectricityData(this.allData);
    }
};

// Global functions for HTML onclick handlers (ensure they point to electricity)
function showAddElectricityForm() {
    electricity.showAddElectricityForm();
}

function hideAddElectricityForm() {
    electricity.hideAddElectricityForm();
}

function loadElectricityData() {
    electricity.loadElectricityData();
}

function exportElectricityToCsv() {
    electricity.exportElectricityToCsv();
}

function changeElectricityPage(direction) {
    electricity.changePage(direction);
}

function changeElectricityPageSize() {
    electricity.changePageSize();
}

// Make sure the electricity object is globally accessible
window.electricity = electricity;
