/**
 * AftermarketTracker - Automotive Parts & Service Management System
 * Main application controller for frontend interactions
 */

// ============================================================================
// APPLICATION STATE
// ============================================================================
let currentView = 'dashboard';
let currentEditId = null;
let allParts = [];
let allCustomers = [];
let allServiceOrders = [];

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeForms();
    initializeKeyboardNavigation();
    loadDashboard();
    updateLastUpdateTime();
    setInterval(updateLastUpdateTime, 60000); // Update every minute
});

// ============================================================================
// UI UTILITIES - Loading, Toasts, and Feedback
// ============================================================================
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
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => toast.remove());

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.success}</div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
        </div>
    `;
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    // Auto-dismiss after 5 seconds
    const timeoutId = setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);

    // Clear timeout if manually closed
    closeBtn.addEventListener('click', () => clearTimeout(timeoutId), { once: true });
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================
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

// ============================================================================
// NAVIGATION & VIEW SWITCHING
// ============================================================================
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

// ============================================================================
// DASHBOARD FUNCTIONS
// ============================================================================
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

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
                    <div class="list-item-title">${order.roNumber || 'N/A'} - ${order.customerName || 'Unknown'}</div>
                    <div class="list-item-subtitle">${order.vehicle || 'No vehicle info'}</div>
                </div>
                <span class="status-badge ${(order.status || 'open').toLowerCase().replace(/\s/g, '-')}">${order.status || 'Open'}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
        const container = document.getElementById('recent-orders');
        if (container) {
            container.innerHTML = '<p style="color: var(--danger-color); font-size: 14px;">Failed to load recent orders</p>';
        }
    }
}

async function loadInventoryAlerts() {
    try {
        const response = await fetch('/api/parts');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const parts = await response.json();
        const lowStock = parts.filter(p =>
            p.quantity !== undefined &&
            p.minStock !== undefined &&
            p.quantity <= p.minStock
        );

        const container = document.getElementById('inventory-alerts');
        if (lowStock.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">All parts in stock</p>';
            return;
        }

        container.innerHTML = lowStock.map(part => `
            <div class="list-item">
                <div>
                    <div class="list-item-title">${part.partNumber || 'N/A'} - ${part.name || 'Unknown Part'}</div>
                    <div class="list-item-subtitle">Current: ${part.quantity || 0} (Min: ${part.minStock || 0})</div>
                </div>
                <span class="status-badge low-stock">Low Stock</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading inventory alerts:', error);
        const container = document.getElementById('inventory-alerts');
        if (container) {
            container.innerHTML = '<p style="color: var(--danger-color); font-size: 14px;">Failed to load inventory alerts</p>';
        }
    }
}

// ============================================================================
// PARTS MANAGEMENT
// ============================================================================
async function loadParts() {
    try {
        showLoading();
        const response = await fetch('/api/parts');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allParts = await response.json();
        renderParts(allParts);
    } catch (error) {
        console.error('Error loading parts:', error);
        showToast('Error Loading Parts', 'Failed to load parts inventory. Please try again.', 'error');
        allParts = [];
        renderParts([]);
    } finally {
        hideLoading();
    }
}

function renderParts(parts) {
    const tbody = document.getElementById('parts-tbody');
    if (parts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; color: var(--text-muted);">No parts found</td></tr>';
        return;
    }

    tbody.innerHTML = parts.map(part => `
        <tr>
            <td><strong>${part.name || '-'}</strong></td>
            <td>${part.partNumber || '-'}</td>
            <td>${part.manufacturer || '-'}</td>
            <td>${part.category || '-'}</td>
            <td>${part.laborTime || '-'}</td>
            <td>${formatCurrency(part.dealerCost)}</td>
            <td>${part.laborCost ? formatCurrency(part.laborCost) : '-'}</td>
            <td>${formatCurrency(part.salesCost)}</td>
            <td><strong>${formatCurrency(part.retailPrice)}</strong></td>
            <td>${part.location || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn" onclick="editPart('${part.id}')" title="Edit" aria-label="Edit ${part.name || part.partNumber}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="deletePart('${part.id}')" title="Delete" aria-label="Delete ${part.name || part.partNumber}">
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
        if (!part) {
            showToast('Error', 'Part not found', 'error');
            return;
        }

        title.textContent = 'Edit Part';
        document.getElementById('part-id').value = part.id;
        document.getElementById('part-name').value = part.name || '';
        document.getElementById('part-number').value = part.partNumber || '';
        document.getElementById('part-manufacturer').value = part.manufacturer || '';
        document.getElementById('part-category').value = part.category || '';
        document.getElementById('part-location').value = part.location || '';
        document.getElementById('part-labor-time').value = part.laborTime || '';
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

    // Focus first input for accessibility
    setTimeout(() => {
        const firstInput = form.querySelector('input:not([type="hidden"])');
        if (firstInput) firstInput.focus();
    }, 100);
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

// ============================================================================
// SERVICE ORDERS (RO) MANAGEMENT
// ============================================================================
async function loadServiceOrders() {
    try {
        showLoading();
        const response = await fetch('/api/service-orders');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allServiceOrders = await response.json();
        renderServiceOrders(allServiceOrders);
    } catch (error) {
        console.error('Error loading service orders:', error);
        showToast('Error Loading Service Orders', 'Failed to load service orders. Please try again.', 'error');
        allServiceOrders = [];
        renderServiceOrders([]);
    } finally {
        hideLoading();
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
        if (!order) {
            showToast('Error', 'Service order not found', 'error');
            return;
        }

        title.textContent = 'Edit Service Order';
        document.getElementById('service-id').value = order.id;
        document.getElementById('service-ro-number').value = order.roNumber || '';
        document.getElementById('service-customer-name').value = order.customerName || '';
        document.getElementById('service-vehicle').value = order.vehicle || '';
        document.getElementById('service-vin').value = order.vin || '';
        document.getElementById('service-mileage').value = order.mileage || '';
        document.getElementById('service-promised-date').value = order.promisedDate || '';
        document.getElementById('service-advisor').value = order.serviceAdvisor || '';
        document.getElementById('service-technician').value = order.technician || '';
        document.getElementById('service-status').value = order.status || 'Open';
        document.getElementById('service-concerns').value = order.concerns || '';
    } else {
        title.textContent = 'New Service Order';
        form.reset();
        document.getElementById('service-id').value = '';
        document.getElementById('service-status').value = 'Open';
    }

    document.getElementById('modal-overlay').classList.add('active');
    modal.classList.add('active');

    // Focus first input for accessibility
    setTimeout(() => {
        const firstInput = form.querySelector('input:not([type="hidden"])');
        if (firstInput) firstInput.focus();
    }, 100);
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

// ============================================================================
// CUSTOMER ACCOUNTS MANAGEMENT
// ============================================================================
async function loadAccounts() {
    try {
        showLoading();
        const response = await fetch('/api/customers');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allCustomers = await response.json();
        renderAccounts(allCustomers);
    } catch (error) {
        console.error('Error loading accounts:', error);
        showToast('Error Loading Accounts', 'Failed to load customer accounts. Please try again.', 'error');
        allCustomers = [];
        renderAccounts([]);
    } finally {
        hideLoading();
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
        if (!customer) {
            showToast('Error', 'Account not found', 'error');
            return;
        }

        title.textContent = 'Edit Account';
        document.getElementById('account-id').value = customer.id;
        document.getElementById('account-type').value = customer.type || 'Retail';
        document.getElementById('account-number').value = customer.accountNumber || '';
        document.getElementById('account-name').value = customer.name || '';
        document.getElementById('account-company').value = customer.company || '';
        document.getElementById('account-email').value = customer.email || '';
        document.getElementById('account-phone').value = customer.phone || '';
        document.getElementById('account-address').value = customer.address || '';
        document.getElementById('account-city').value = customer.city || '';
        document.getElementById('account-state').value = customer.state || '';
        document.getElementById('account-zip').value = customer.zip || '';
        document.getElementById('account-credit-limit').value = customer.creditLimit || 0;
        document.getElementById('account-tax-exempt').checked = customer.taxExempt || false;
        document.getElementById('account-notes').value = customer.notes || '';
    } else {
        title.textContent = 'Add New Account';
        form.reset();
        document.getElementById('account-id').value = '';
        document.getElementById('account-type').value = 'Retail';
        document.getElementById('account-credit-limit').value = 0;
    }

    document.getElementById('modal-overlay').classList.add('active');
    modal.classList.add('active');

    // Focus first input for accessibility
    setTimeout(() => {
        const firstInput = form.querySelector('input:not([type="hidden"])');
        if (firstInput) firstInput.focus();
    }, 100);
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

// ============================================================================
// FORM HANDLERS & SUBMISSIONS
// ============================================================================
function initializeForms() {
    document.getElementById('part-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('part-id').value;

        const data = {
            name: document.getElementById('part-name').value.trim(),
            partNumber: document.getElementById('part-number').value.trim(),
            manufacturer: document.getElementById('part-manufacturer').value.trim(),
            category: document.getElementById('part-category').value,
            location: document.getElementById('part-location').value.trim(),
            laborTime: parseFloat(document.getElementById('part-labor-time').value) || 0,
            dealerCost: parseFloat(document.getElementById('part-dealer-cost').value) || 0,
            laborCost: parseFloat(document.getElementById('part-labor-cost').value) || 0,
            salesCost: parseFloat(document.getElementById('part-sales-cost').value) || 0,
            retailPrice: parseFloat(document.getElementById('part-retail-price').value) || 0
        };

        // Validate required fields
        if (!data.partNumber) {
            showToast('Validation Error', 'Part number is required', 'error');
            return;
        }
        if (data.dealerCost <= 0 || data.salesCost <= 0 || data.retailPrice <= 0) {
            showToast('Validation Error', 'All cost fields must be greater than zero', 'error');
            return;
        }

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
            accountNumber: document.getElementById('account-number').value.trim(),
            name: document.getElementById('account-name').value.trim(),
            company: document.getElementById('account-company').value.trim(),
            email: document.getElementById('account-email').value.trim(),
            phone: document.getElementById('account-phone').value.trim(),
            address: document.getElementById('account-address').value.trim(),
            city: document.getElementById('account-city').value.trim(),
            state: document.getElementById('account-state').value.trim(),
            zip: document.getElementById('account-zip').value.trim(),
            creditLimit: parseFloat(document.getElementById('account-credit-limit').value) || 0,
            taxExempt: document.getElementById('account-tax-exempt').checked,
            notes: document.getElementById('account-notes').value.trim()
        };

        // Validate required fields
        if (!data.name || !data.email || !data.phone) {
            showToast('Validation Error', 'Name, email, and phone are required', 'error');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showToast('Validation Error', 'Please enter a valid email address', 'error');
            return;
        }

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
            roNumber: document.getElementById('service-ro-number').value.trim(),
            customerName: document.getElementById('service-customer-name').value.trim(),
            vehicle: document.getElementById('service-vehicle').value.trim(),
            vin: document.getElementById('service-vin').value.trim(),
            mileage: document.getElementById('service-mileage').value.trim(),
            promisedDate: document.getElementById('service-promised-date').value,
            serviceAdvisor: document.getElementById('service-advisor').value.trim(),
            technician: document.getElementById('service-technician').value.trim(),
            status: document.getElementById('service-status').value,
            concerns: document.getElementById('service-concerns').value.trim(),
            partsUsed: [],
            laborLines: []
        };

        // Validate required fields
        if (!data.roNumber || !data.customerName || !data.vehicle || !data.serviceAdvisor) {
            showToast('Validation Error', 'RO Number, Customer, Vehicle, and Service Advisor are required', 'error');
            return;
        }

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
        const search = e.target.value.toLowerCase().trim();
        if (!search) {
            renderParts(allParts);
            return;
        }

        const filtered = allParts.filter(p =>
            (p.partNumber && p.partNumber.toLowerCase().includes(search)) ||
            (p.name && p.name.toLowerCase().includes(search)) ||
            (p.manufacturer && p.manufacturer.toLowerCase().includes(search)) ||
            (p.category && p.category.toLowerCase().includes(search))
        );
        renderParts(filtered);
    });

    document.getElementById('accounts-search')?.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase().trim();
        if (!search) {
            renderAccounts(allCustomers);
            return;
        }

        const filtered = allCustomers.filter(c =>
            (c.accountNumber && c.accountNumber.toLowerCase().includes(search)) ||
            (c.name && c.name.toLowerCase().includes(search)) ||
            (c.email && c.email.toLowerCase().includes(search)) ||
            (c.company && c.company.toLowerCase().includes(search)) ||
            (c.phone && c.phone.toLowerCase().includes(search))
        );
        renderAccounts(filtered);
    });

    document.getElementById('service-filter')?.addEventListener('change', (e) => {
        const status = e.target.value;
        const filtered = status === 'all' ? allServiceOrders : allServiceOrders.filter(o => o.status === status);
        renderServiceOrders(filtered);
    });
}

// ============================================================================
// MODAL CONTROLS
// ============================================================================
function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');

    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });

    currentEditId = null;
}

// Close modal when clicking on overlay (outside modal)
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
