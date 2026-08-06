/**
 * storage.js - Módulo de Gestión de Persistencia en localStorage
 * Centraliza la inicialización, lectura y escritura de datos.
 */

const STORAGE_KEYS = {
  USERS: 'inventory_users',
  CURRENT_USER: 'inventory_current_user',
  CATEGORIES: 'inventory_categories',
  PRODUCTS: 'inventory_products',
  MOVEMENTS: 'inventory_movements'
};

// 1. Datos Semilla Iniciales (Seed Data para pruebas rápidas)
const initialSeedData = {
  users: [
    { id: 1, username: 'admin', role: 'ADMIN', name: 'Carlos Admin' },
    { id: 2, username: 'empleado', role: 'EMPLOYEE', name: 'Ana Empleado' }
  ],
  categories: [
    { id: 101, name: 'Electrónica' },
    { id: 102, name: 'Papelería' },
    { id: 103, name: 'Hogar' }
  ],
  products: [
    {
      id: 'PROD-001',
      name: 'Laptop Dell 15"',
      categoryId: 101,
      stock: 12,
      minStock: 5,
      price: 850.00
    },
    {
      id: 'PROD-002',
      name: 'Mouse Inalámbrico',
      categoryId: 101,
      stock: 3, // Stock bajo para alertas
      minStock: 5,
      price: 25.50
    },
    {
      id: 'PROD-003',
      name: 'Cuaderno A4 100 hojas',
      categoryId: 102,
      stock: 50,
      minStock: 10,
      price: 3.20
    }
  ],
  movements: [
    {
      id: 'MOV-1001',
      productId: 'PROD-001',
      type: 'IN', // 'IN' = Entrada, 'OUT' = Salida
      quantity: 12,
      reason: 'Carga inicial de inventario',
      userId: 1,
      timestamp: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'MOV-1002',
      productId: 'PROD-002',
      type: 'OUT',
      quantity: 2,
      reason: 'Venta de prueba',
      userId: 2,
      timestamp: '2026-08-02T11:30:00.000Z'
    }
  ]
};

/**
 * Carga los datos por defecto si localStorage está vacío.
 */
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialSeedData.users));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialSeedData.categories));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialSeedData.products));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(initialSeedData.movements));
  }
}

// 2. Helpers Genéricos
function getFromStorage(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// 3. Operaciones de Productos
function getProducts() {
  return getFromStorage(STORAGE_KEYS.PRODUCTS);
}

function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}

function saveProduct(product) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  
  if (index !== -1) {
    // Merge parcial seguro para no sobrescribir datos no editados
    products[index] = { ...products[index], ...product };
  } else {
    // Producto nuevo
    products.push(product);
  }
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
}

function deleteProduct(id) {
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  saveToStorage(STORAGE_KEYS.PRODUCTS, products);
}

// 4. Operaciones de Categorías
function getCategories() {
  return getFromStorage(STORAGE_KEYS.CATEGORIES);
}

function saveCategory(category) {
  const categories = getCategories();
  categories.push(category);
  saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
}

// 5. Operaciones de Movimientos (Entradas / Salidas)
function getMovements() {
  return getFromStorage(STORAGE_KEYS.MOVEMENTS);
}

function addMovement(movement) {
  const movements = getMovements();
  movements.unshift(movement); // Inserta al inicio para ordenar por más reciente
  saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);
}

// Autoejecutar inicialización al cargar la página
initStorage();