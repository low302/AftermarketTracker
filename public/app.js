// Application State
let currentView = 'dashboard';
let currentEditId = null;
let allParts = [];
let allCustomers = [];
let allServiceOrders = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeForms();
    initializeKeyboardNavigation();
    loadDashboard();
    updateLastUpdateTime();
    setInterval(updateLastUpdateTime, 60000); // Update every minute
});

// Utility Functions - Loading and Toast
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
}

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">×</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Keyboard Navigation
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal();
            }
        }
    });
}

// Navigation
function initializeNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    // Update active nav button and aria-current
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
            btn.setAttribute('aria-current', 'page');
        }
    });

    // Update active view content
    document.querySelectorAll('.view-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${view}-view`).classList.add('active');

    currentView = view;

    // Load data for the view
    switch(view) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'parts':
            loadParts();
            break;
        case 'service':
            loadServiceOrders();
            break;
        case 'accounts':
            loadAccounts();
            break;
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const element = document.getElementById('last-update-time');
    if (element) {
        element.textContent = timeString;
    }
}

// Dashboard Functions
async function loadDashboard() {
    try {
        showLoading();
        const response = await fetch('/api/dashboard');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const stats = await response.json();

        document.getElementById('stat-total-parts').textContent = stats.totalParts;
        document.getElementById('stat-low-stock').textContent = stats.lowStockParts;
        document.getElementById('stat-open-orders').textContent = stats.openServiceOrders;
        document.getElementById('stat-revenue').textContent = formatCurrency(stats.totalRevenue);

        await loadRecentOrders();
        await loadInventoryAlerts();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error Loading Dashboard', 'Failed to load dashboard data. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch('/api/service-orders');
        const orders = await response.json();
        const recent = orders.slice(-5).reverse();

        const container = document.getElementById('recent-orders');
        if (recent.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">No service orders yet</p>';
            return;
        }

        container.innerHTML = recent.map(order => `
            <div class="list-item">
                <div>
                    <div class="list-item-title">${order.roNumber} - ${order.customerName}</div>
                    <div class="list-item-subtitle">${order.vehicle}</div>
                </div>
                <span class="status-badge ${order.status.toLowerCase().replace(/\s/g, '-')}">${order.status}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

async function loadInventoryAlerts() {
    try {
        const response = await fetch('/api/parts');
        const parts = await response.json();
        const lowStock = parts.filter(p => p.quantity <= p.minStock);

        const container = document.getElementById('inventory-alerts');
        if (lowStock.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">All parts in stock</p>';
            return;
        }

        container.innerHTML = lowStock.map(part => `
            <div class="list-item">
                <div>
                    <div class="list-item-title">${part.partNumber} - ${part.description}</div>
                    <div class="list-item-subtitle">Qty: ${part.quantity} (Min: ${part.minStock})</div>
                </div>
                <span class="status-badge low-stock">Low Stock</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading inventory alerts:', error);
    }
}

// Parts Functions
async function loadParts() {
    try {
        const response = await fetch('/api/parts');
        allParts = await response.json();
        renderParts(allParts);
    } catch (error) {
        console.error('Error loading parts:', error);
    }
}

function renderParts(parts) {
    const tbody = document.getElementById('parts-tbody');
    if (parts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; color: var(--text-muted);">No parts found</td></tr>';
        return;
    }

    tbody.innerHTML = parts.map(part => `
        <tr>
            <td><strong>${part.name || part.description || '-'}</strong></td>
            <td>${part.partNumber}</td>
            <td>${part.manufacturer || '-'}</td>
            <td>${part.category}</td>
            <td ${part.quantity <= part.minStock ? 'style="color: var(--danger-color); font-weight: 600;"' : ''}>${part.quantity}</td>
            <td>${part.laborTime || '-'}</td>
            <td>${formatCurrency(part.dealerCost)}</td>
            <td>${part.laborCost ? formatCurrency(part.laborCost) : '-'}</td>
            <td>${formatCurrency(part.salesCost)}</td>
            <td><strong>${formatCurrency(part.retailPrice)}</strong></td>
            <td>${part.location || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn" onclick="editPart('${part.id}')" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="deletePart('${part.id}')" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function showPartModal(id = null) {
    currentEditId = id;
    const modal = document.getElementById('part-modal');
    const form = document.getElementById('part-form');
    const title = document.getElementById('part-modal-title');

    if (id) {
        const part = allParts.find(p => p.id === id);
        title.textContent = 'Edit Part';
        document.getElementById('part-id').value = part.id;
        document.getElementById('part-name').value = part.name || '';
        document.getElementById('part-number').value = part.partNumber;
        document.getElementById('part-manufacturer').value = part.manufacturer || '';
        document.getElementById('part-category').value = part.category;
        document.getElementById('part-location').value = part.location || '';
        document.getElementById('part-labor-time').value = part.laborTime || '';
        document.getElementById('part-quantity').value = part.quantity;
        document.getElementById('part-min-stock').value = part.minStock;
        document.getElementById('part-dealer-cost').value = part.dealerCost || '';
        document.getElementById('part-labor-cost').value = part.laborCost || '';
        document.getElementById('part-sales-cost').value = part.salesCost || '';
        document.getElementById('part-retail-price').value = part.retailPrice || '';
    } else {
        title.textContent = 'Add New Part';
        form.reset();
        document.getElementById('part-id').value = '';
    }

    document.getElementById('modal-overlay').classList.add('active');
    modal.classList.add('active');
}

function editPart(id) {
    showPartModal(id);
}

async function deletePart(id) {
    if (!confirm('Are you sure you want to delete this part?')) return;

    try {
        showLoading();
        const response = await fetch(`/api/parts/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        showToast('Part Deleted', 'Part has been successfully deleted.', 'success');
        loadParts();
        if (currentView === 'dashboard') loadDashboard();
    } catch (error) {
        console.error('Error deleting part:', error);
        showToast('Error Deleting Part', 'Failed to delete part. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Service Orders Functions
async function loadServiceOrders() {
    try {
        const response = await fetch('/api/service-orders');
        allServiceOrders = await response.json();
        renderServiceOrders(allServiceOrders);
    } catch (error) {
        console.error('Error loading service orders:', error);
    }
}

function renderServiceOrders(orders) {
    const tbody = document.getElementById('service-tbody');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No service orders found</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.roNumber}</strong></td>
            <td>${order.customerName}</td>
            <td>${order.vehicle}</td>
            <td>${order.vin || '-'}</td>
            <td><span class="status-badge ${order.status.toLowerCase().replace(/\s/g, '-')}">${order.status}</span></td>
            <td>${order.serviceAdvisor}</td>
            <td><strong>${formatCurrency(order.total)}</strong></td>
            <td>${order.promisedDate ? new Date(order.promisedDate).toLocaleDateString() : '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn" onclick="editServiceOrder('${order.id}')" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="deleteServiceOrder('${order.id}')" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function showServiceModal(id = null) {
    currentEditId = id;
    const modal = document.getElementById('service-modal');
    const form = document.getElementById('service-form');
    const title = document.getElementById('service-modal-title');

    if (id) {
        const order = allServiceOrders.find(o => o.id === id);
        title.textContent = 'Edit Service Order';
        document.getElementById('service-id').value = order.id;
        document.getElementById('service-ro-number').value = order.roNumber;
        document.getElementById('service-customer-name').value = order.customerName;
        document.getElementById('service-vehicle').value = order.vehicle;
        document.getElementById('service-vin').value = order.vin || '';
        document.getElementById('service-mileage').value = order.mileage || '';
        document.getElementById('service-promised-date').value = order.promisedDate || '';
        document.getElementById('service-advisor').value = order.serviceAdvisor;
        document.getElementById('service-technician').value = order.technician || '';
        document.getElementById('service-status').value = order.status;
        document.getElementById('service-concerns').value = order.concerns || '';
    } else {
        title.textContent = 'New Service Order';
        form.reset();
        document.getElementById('service-id').value = '';
    }

    document.getElementById('modal-overlay').classList.add('active');
    modal.classList.add('active');
}

function editServiceOrder(id) {
    showServiceModal(id);
}

async function deleteServiceOrder(id) {
    if (!confirm('Are you sure you want to delete this service order?')) return;

    try {
        showLoading();
        const response = await fetch(`/api/service-orders/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        showToast('Service Order Deleted', 'Service order has been successfully deleted.', 'success');
        loadServiceOrders();
        if (currentView === 'dashboard') loadDashboard();
    } catch (error) {
        console.error('Error deleting service order:', error);
        showToast('Error Deleting Service Order', 'Failed to delete service order. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Accounts Functions
async function loadAccounts() {
    try {
        const response = await fetch('/api/customers');
        allCustomers = await response.json();
        renderAccounts(allCustomers);
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
}

function renderAccounts(customers) {
    const tbody = document.getElementById('accounts-tbody');
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No accounts found</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td><strong>${customer.accountNumber}</strong></td>
            <td><span class="status-badge">${customer.type}</span></td>
            <td>${customer.name}</td>
            <td>${customer.company || '-'}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${formatCurrency(customer.balance || 0)}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn" onclick="editAccount('${customer.id}')" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="deleteAccount('${customer.id}')" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function showAccountModal(id = null) {
    currentEditId = id;
    const modal = document.getElementById('account-modal');
    const form = document.getElementById('account-form');
    const title = document.getElementById('account-modal-title');

    if (id) {
        const customer = allCustomers.find(c => c.id === id);
        title.textContent = 'Edit Account';
        document.getElementById('account-id').value = customer.id;
        document.getElementById('account-type').value = customer.type;
        document.getElementById('account-number').value = customer.accountNumber;
        document.getElementById('account-name').value = customer.name;
        document.getElementById('account-company').value = customer.company || '';
        document.getElementById('account-email').value = customer.email;
        document.getElementById('account-phone').value = customer.phone;
        document.getElementById('account-address').value = customer.address || '';
        document.getElementById('account-city').value = customer.city || '';
        document.getElementById('account-state').value = customer.state || '';
        document.getElementById('account-zip').value = customer.zip || '';
        document.getElementById('account-credit-limit').value = customer.creditLimit || 0;
        document.getElementById('account-tax-exempt').checked = customer.taxExempt;
        document.getElementById('account-notes').value = customer.notes || '';
    } else {
        title.textContent = 'Add New Account';
        form.reset();
        document.getElementById('account-id').value = '';
    }

    document.getElementById('modal-overlay').classList.add('active');
    modal.classList.add('active');
}

function editAccount(id) {
    showAccountModal(id);
}

async function deleteAccount(id) {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
        showLoading();
        const response = await fetch(`/api/customers/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        showToast('Account Deleted', 'Account has been successfully deleted.', 'success');
        loadAccounts();
    } catch (error) {
        console.error('Error deleting account:', error);
        showToast('Error Deleting Account', 'Failed to delete account. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Form Submissions
function initializeForms() {
    document.getElementById('part-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('part-id').value;

        const data = {
            name: document.getElementById('part-name').value,
            partNumber: document.getElementById('part-number').value,
            manufacturer: document.getElementById('part-manufacturer').value,
            category: document.getElementById('part-category').value,
            location: document.getElementById('part-location').value,
            laborTime: parseFloat(document.getElementById('part-labor-time').value) || 0,
            quantity: parseInt(document.getElementById('part-quantity').value),
            minStock: parseInt(document.getElementById('part-min-stock').value),
            dealerCost: parseFloat(document.getElementById('part-dealer-cost').value),
            laborCost: parseFloat(document.getElementById('part-labor-cost').value) || 0,
            salesCost: parseFloat(document.getElementById('part-sales-cost').value),
            retailPrice: parseFloat(document.getElementById('part-retail-price').value)
        };

        try {
            showLoading();
            let response;
            if (id) {
                response = await fetch(`/api/parts/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                response = await fetch('/api/parts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            closeModal();
            showToast(id ? 'Part Updated' : 'Part Created', `Part has been successfully ${id ? 'updated' : 'created'}.`, 'success');
            loadParts();
            if (currentView === 'dashboard') loadDashboard();
        } catch (error) {
            console.error('Error saving part:', error);
            showToast('Error Saving Part', 'Failed to save part. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });

    document.getElementById('account-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('account-id').value;

        const data = {
            type: document.getElementById('account-type').value,
            accountNumber: document.getElementById('account-number').value,
            name: document.getElementById('account-name').value,
            company: document.getElementById('account-company').value,
            email: document.getElementById('account-email').value,
            phone: document.getElementById('account-phone').value,
            address: document.getElementById('account-address').value,
            city: document.getElementById('account-city').value,
            state: document.getElementById('account-state').value,
            zip: document.getElementById('account-zip').value,
            creditLimit: document.getElementById('account-credit-limit').value,
            taxExempt: document.getElementById('account-tax-exempt').checked,
            notes: document.getElementById('account-notes').value
        };

        try {
            showLoading();
            let response;
            if (id) {
                response = await fetch(`/api/customers/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                response = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            closeModal();
            showToast(id ? 'Account Updated' : 'Account Created', `Account has been successfully ${id ? 'updated' : 'created'}.`, 'success');
            loadAccounts();
        } catch (error) {
            console.error('Error saving account:', error);
            showToast('Error Saving Account', 'Failed to save account. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });

    document.getElementById('service-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('service-id').value;

        const data = {
            roNumber: document.getElementById('service-ro-number').value,
            customerName: document.getElementById('service-customer-name').value,
            vehicle: document.getElementById('service-vehicle').value,
            vin: document.getElementById('service-vin').value,
            mileage: document.getElementById('service-mileage').value,
            promisedDate: document.getElementById('service-promised-date').value,
            serviceAdvisor: document.getElementById('service-advisor').value,
            technician: document.getElementById('service-technician').value,
            status: document.getElementById('service-status').value,
            concerns: document.getElementById('service-concerns').value,
            partsUsed: [],
            laborLines: []
        };

        try {
            showLoading();
            let response;
            if (id) {
                response = await fetch(`/api/service-orders/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                response = await fetch('/api/service-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            closeModal();
            showToast(id ? 'Service Order Updated' : 'Service Order Created', `Service order has been successfully ${id ? 'updated' : 'created'}.`, 'success');
            loadServiceOrders();
            if (currentView === 'dashboard') loadDashboard();
        } catch (error) {
            console.error('Error saving service order:', error);
            showToast('Error Saving Service Order', 'Failed to save service order. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });

    // Search functionality
    document.getElementById('parts-search')?.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const filtered = allParts.filter(p =>
            p.partNumber.toLowerCase().includes(search) ||
            (p.name && p.name.toLowerCase().includes(search)) ||
            (p.description && p.description.toLowerCase().includes(search)) ||
            (p.manufacturer && p.manufacturer.toLowerCase().includes(search))
        );
        renderParts(filtered);
    });

    document.getElementById('accounts-search')?.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const filtered = allCustomers.filter(c => 
            c.accountNumber.toLowerCase().includes(search) ||
            c.name.toLowerCase().includes(search) ||
            c.email.toLowerCase().includes(search) ||
            c.company?.toLowerCase().includes(search)
        );
        renderAccounts(filtered);
    });

    document.getElementById('service-filter')?.addEventListener('change', (e) => {
        const status = e.target.value;
        const filtered = status === 'all' ? allServiceOrders : allServiceOrders.filter(o => o.status === status);
        renderServiceOrders(filtered);
    });
}

// Modal Controls
function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    currentEditId = null;
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}
