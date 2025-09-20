// main.js
const API_BASE_URL = 'http://192.168.0.225:2992';
let currentEditId = null;
let itemToDelete = null;
let deleteType = null;
let currentPage = 'properties';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    property.loadProperties();
    setupFormSubmissions();
    
    // Set current year as default
    document.getElementById('heat_vuosi').value = new Date().getFullYear();
    document.getElementById('electricity_vuosi').value = new Date().getFullYear();
    document.getElementById('water_vuosi').value = new Date().getFullYear();
});

// Navigation
function showPage(pageName, event) { // Added 'event' parameter
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(pageName + 'Page');
    if (selectedPage) {
        selectedPage.classList.add('active');
    } else {
        console.error(`Error: Page element with ID '${pageName}Page' not found.`);
    }
    
    // Set active nav item
    if (event && event.target) { // Check if event is defined
        event.target.classList.add('active');
    }
    
    currentPage = pageName;
    
    // Load data for the selected page
    if (pageName === 'properties') {
        property.loadProperties();
    } else if (pageName === 'heat') {
        heat.loadHeatData();
        heat.loadPropertiesForSelect();
    } else if (pageName === 'electricity') {
        electricity.loadElectricityData();
        electricity.loadPropertiesForSelect();
    } else if (pageName === 'water') {
        water.loadWaterData();
        water.loadPropertiesForSelect();
    }
}

// FORM SUBMISSIONS
function setupFormSubmissions() {
    // Property form submission
    document.getElementById('propertyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await property.handlePropertyFormSubmit();
    });

    // Heat form submission
    document.getElementById('heatForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await heat.handleHeatFormSubmit();
    });
    
    // Electricity form submission
    document.getElementById('electricityForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await electricity.handleElectricityFormSubmit();
    });

    // Water form submission
    document.getElementById('waterForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await water.handleWaterFormSubmit();
    });
}

// DELETE MODAL FUNCTIONALITY
function showDeleteModal(type, id, description) {
    deleteType = type;
    itemToDelete = id;
    
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('deleteMessage');
    const info = document.getElementById('deleteItemInfo');

    if (!modal || !message || !info) {
        console.error('Error: Delete modal elements not found.');
        return;
    }
    
    // Use textContent for safety when setting dynamic content that is not meant to be HTML
    if (type === 'property') {
        message.textContent = 'Are you sure you want to delete this property?';
        info.innerHTML = `<strong>Property:</strong> ${description}<br><strong>ID:</strong> ${id}`; // description already escaped
    } else if (type === 'heat') {
        message.textContent = 'Are you sure you want to delete this heat reading?';
        info.innerHTML = `<strong>Reading:</strong> ${description}`; // description already escaped
    } else if (type === 'electricity') {
        message.textContent = 'Are you sure you want to delete this electricity reading?';
        info.innerHTML = `<strong>Reading:</strong> ${description}`; // description already escaped
    } else if (type === 'water') {
        message.textContent = 'Are you sure you want to delete this water reading?';
        info.innerHTML = `<strong>Reading:</strong> ${description}`; // description already escaped
    } 
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            itemToDelete = null;
            deleteType = null;
        }, 300);
    } else {
        console.error('Error: Delete modal not found when trying to close.');
    }
}

async function confirmDelete() {
    if (!itemToDelete || !deleteType) return;
    
    try {
        const endpoint = deleteType === 'property' ? 'property' : 
                        deleteType === 'heat' ? 'heat' : 
                        deleteType === 'electricity' ? 'electricity' : 'water';

        const response = await fetch(`${API_BASE_URL}/${endpoint}/${itemToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to delete ${deleteType}`);
        }

        const successMessage = deleteType === 'property' ? 'Property' : 
                              deleteType === 'heat' ? 'Heat reading' : 
                              deleteType === 'electricity' ? 'Electricity reading' : 
                              'Water reading';

        showSuccess(`${successMessage} deleted successfully!`);
        closeDeleteModal();

        // Reload appropriate data
        if (deleteType === 'property') {
            property.loadProperties();
        } else if (deleteType === 'heat') {
            heat.loadHeatData();
        } else if (deleteType === 'electricity') {
            electricity.loadElectricityData();
        } else if (deleteType === 'water') {
            water.loadWaterData();
        }
    } catch (error) {
        console.error(`Error deleting ${deleteType}:`, error);
        showError(error.message);
    }
}

// UTILITY FUNCTIONS
function showPropertiesLoading() {
    const loadingMessage = document.getElementById('propertiesLoadingMessage');
    const table = document.getElementById('propertiesTable');
    if (loadingMessage) {
        loadingMessage.classList.remove('hidden');
    } else {
        console.warn('Warning: propertiesLoadingMessage element not found.');
    }
    if (table) {
        table.classList.add('hidden');
    } else {
        console.warn('Warning: propertiesTable element not found.');
    }
}

function hidePropertiesLoading() {
    const loadingMessage = document.getElementById('propertiesLoadingMessage');
    if (loadingMessage) {
        loadingMessage.classList.add('hidden');
    } else {
        console.warn('Warning: propertiesLoadingMessage element not found.');
    }
}

function showHeatLoading() {
    const loadingMessage = document.getElementById('heatLoadingMessage');
    const table = document.getElementById('heatTable');
    if (loadingMessage) {
        loadingMessage.classList.remove('hidden');
    } else {
        console.warn('Warning: heatLoadingMessage element not found.');
    }
    if (table) {
        table.classList.add('hidden');
    } else {
        console.warn('Warning: heatTable element not found.');
    }
}

function hideHeatLoading() {
    const loadingMessage = document.getElementById('heatLoadingMessage');
    if (loadingMessage) {
        loadingMessage.classList.add('hidden');
    } else {
        console.warn('Warning: heatLoadingMessage element not found.');
    }
}

function showElectricityLoading() {
    const loadingMessage = document.getElementById('electricityLoadingMessage');
    const table = document.getElementById('electricityTable');
    if (loadingMessage) {
        loadingMessage.classList.remove('hidden');
    } else {
        console.error('Error: electricityLoadingMessage element not found. Please check index.html');
    }
    if (table) {
        table.classList.add('hidden');
    } else {
        console.error('Error: electricityTable element not found. Please check index.html');
    }
}

function hideElectricityLoading() {
    const loadingMessage = document.getElementById('electricityLoadingMessage');
    if (loadingMessage) {
        loadingMessage.classList.add('hidden');
    } else {
        console.error('Error: electricityLoadingMessage element not found. Please check index.html');
    }
}

function showWaterLoading() {
    const loadingMessage = document.getElementById('waterLoadingMessage');
    const table = document.getElementById('waterTable');
    if (loadingMessage) {
        loadingMessage.classList.remove('hidden');
    } else {
        console.warn('Warning: waterLoadingMessage element not found.');
    }
    if (table) {
        table.classList.add('hidden');
    } else {
        console.warn('Warning: waterTable element not found.');
    }
}

function hideWaterLoading() {
    const loadingMessage = document.getElementById('waterLoadingMessage');
    if (loadingMessage) {
        loadingMessage.classList.add('hidden');
    } else {
        console.warn('Warning: waterLoadingMessage element not found.');
    }
}

function showError(message) {
    const container = document.getElementById('messageContainer');
    if (container) {
        container.innerHTML = `<div class="error">❌ ${message}</div>`;
        setTimeout(() => container.innerHTML = '', 5000);
    } else {
        console.error('Error: messageContainer element not found.');
    }
}

function showSuccess(message) {
    const container = document.getElementById('messageContainer');
    if (container) {
        container.innerHTML = `<div class="success">✅ ${message}</div>`;
        setTimeout(() => container.innerHTML = '', 3000);
    } else {
        console.error('Error: messageContainer element not found.');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('deleteModal');
    if (modal && event.target === modal) {
        closeDeleteModal();
    }
}

// Utility function to escape HTML for safe display
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
