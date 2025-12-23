const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize data directory and files
async function initializeData() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    const files = {
      'parts.json': [],
      'customers.json': [],
      'service_orders.json': [],
      'invoices.json': [],
      'inventory_transactions.json': []
    };
    
    for (const [filename, defaultData] of Object.entries(files)) {
      const filepath = path.join(DATA_DIR, filename);
      try {
        await fs.access(filepath);
      } catch {
        await fs.writeFile(filepath, JSON.stringify(defaultData, null, 2));
      }
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Helper functions
async function readData(filename) {
  const filepath = path.join(DATA_DIR, filename);
  const data = await fs.readFile(filepath, 'utf8');
  return JSON.parse(data);
}

async function writeData(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
}

// PARTS API ENDPOINTS
app.get('/api/parts', async (req, res) => {
  try {
    const parts = await readData('parts.json');
    res.json(parts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/parts', async (req, res) => {
  try {
    const parts = await readData('parts.json');
    const newPart = {
      id: Date.now().toString(),
      name: req.body.name,
      partNumber: req.body.partNumber,
      manufacturer: req.body.manufacturer,
      category: req.body.category,
      location: req.body.location,
      laborTime: parseFloat(req.body.laborTime || 0),
      quantity: parseInt(req.body.quantity),
      minStock: parseInt(req.body.minStock || 0),
      dealerCost: parseFloat(req.body.dealerCost),
      laborCost: parseFloat(req.body.laborCost || 0),
      salesCost: parseFloat(req.body.salesCost),
      retailPrice: parseFloat(req.body.retailPrice),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    parts.push(newPart);
    await writeData('parts.json', parts);
    res.json(newPart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/parts/:id', async (req, res) => {
  try {
    const parts = await readData('parts.json');
    const index = parts.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Part not found' });
    }
    parts[index] = { ...parts[index], ...req.body, updatedAt: new Date().toISOString() };
    await writeData('parts.json', parts);
    res.json(parts[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/parts/:id', async (req, res) => {
  try {
    const parts = await readData('parts.json');
    const filtered = parts.filter(p => p.id !== req.params.id);
    await writeData('parts.json', filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CUSTOMERS API ENDPOINTS
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await readData('customers.json');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customers = await readData('customers.json');
    const newCustomer = {
      id: Date.now().toString(),
      accountNumber: req.body.accountNumber || `ACC${Date.now()}`,
      type: req.body.type,
      name: req.body.name,
      company: req.body.company,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      taxExempt: req.body.taxExempt || false,
      creditLimit: parseFloat(req.body.creditLimit || 0),
      balance: 0,
      notes: req.body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    await writeData('customers.json', customers);
    res.json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const customers = await readData('customers.json');
    const index = customers.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    customers[index] = { ...customers[index], ...req.body, updatedAt: new Date().toISOString() };
    await writeData('customers.json', customers);
    res.json(customers[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const customers = await readData('customers.json');
    const filtered = customers.filter(c => c.id !== req.params.id);
    await writeData('customers.json', filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SERVICE ORDERS (RO) API ENDPOINTS
app.get('/api/service-orders', async (req, res) => {
  try {
    const orders = await readData('service_orders.json');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/service-orders', async (req, res) => {
  try {
    const orders = await readData('service_orders.json');
    const newOrder = {
      id: Date.now().toString(),
      roNumber: req.body.roNumber || `RO${Date.now()}`,
      customerId: req.body.customerId,
      customerName: req.body.customerName,
      vehicle: req.body.vehicle,
      vin: req.body.vin,
      mileage: req.body.mileage,
      status: req.body.status || 'Open',
      serviceAdvisor: req.body.serviceAdvisor,
      technician: req.body.technician,
      concerns: req.body.concerns,
      partsUsed: req.body.partsUsed || [],
      laborLines: req.body.laborLines || [],
      subtotal: 0,
      tax: 0,
      total: 0,
      promisedDate: req.body.promisedDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Calculate totals
    const partsTotal = newOrder.partsUsed.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const laborTotal = newOrder.laborLines.reduce((sum, labor) => sum + (labor.rate * labor.hours), 0);
    newOrder.subtotal = partsTotal + laborTotal;
    newOrder.tax = newOrder.subtotal * 0.0825; // 8.25% tax
    newOrder.total = newOrder.subtotal + newOrder.tax;
    
    orders.push(newOrder);
    await writeData('service_orders.json', orders);
    res.json(newOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/service-orders/:id', async (req, res) => {
  try {
    const orders = await readData('service_orders.json');
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Service order not found' });
    }
    
    const updatedOrder = { ...orders[index], ...req.body, updatedAt: new Date().toISOString() };
    
    // Recalculate totals
    const partsTotal = updatedOrder.partsUsed.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const laborTotal = updatedOrder.laborLines.reduce((sum, labor) => sum + (labor.rate * labor.hours), 0);
    updatedOrder.subtotal = partsTotal + laborTotal;
    updatedOrder.tax = updatedOrder.subtotal * 0.0825;
    updatedOrder.total = updatedOrder.subtotal + updatedOrder.tax;
    
    orders[index] = updatedOrder;
    await writeData('service_orders.json', orders);
    res.json(orders[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/service-orders/:id', async (req, res) => {
  try {
    const orders = await readData('service_orders.json');
    const filtered = orders.filter(o => o.id !== req.params.id);
    await writeData('service_orders.json', filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DASHBOARD STATS
app.get('/api/dashboard', async (req, res) => {
  try {
    const parts = await readData('parts.json');
    const customers = await readData('customers.json');
    const orders = await readData('service_orders.json');
    
    const lowStockParts = parts.filter(p => p.quantity <= p.minStock);
    const openOrders = orders.filter(o => o.status === 'Open');
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    
    res.json({
      totalParts: parts.length,
      lowStockParts: lowStockParts.length,
      totalCustomers: customers.length,
      openServiceOrders: openOrders.length,
      totalServiceOrders: orders.length,
      totalRevenue: totalRevenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`DealerTrack Server running on http://localhost:${PORT}`);
  });
});
