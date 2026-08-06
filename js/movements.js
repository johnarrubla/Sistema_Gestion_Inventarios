/**
 * movements.js - Módulo de Gestión de Movimientos e Inventario
 * Controla el flujo de Entradas (IN) y Salidas (OUT) y actualiza el stock de forma automática.
 */

/**
 * Registra una entrada o salida de inventario y actualiza el stock del producto.
 * @param {Object} data { productId, type, quantity, reason }
 * @returns {Object} { success: boolean, message: string }
 */
function registerMovement({ productId, type, quantity, reason }) {
  const qty = parseInt(quantity, 10);

  // 1. Validaciones iniciales
  if (!productId || isNaN(qty) || qty <= 0) {
    return { success: false, message: 'La cantidad debe ser un número entero mayor a 0.' };
  }

  if (!['IN', 'OUT'].includes(type)) {
    return { success: false, message: 'Tipo de movimiento inválido. Debe ser IN u OUT.' };
  }

  // 2. Obtener producto de localStorage
  const product = getProductById(productId);
  if (!product) {
    return { success: false, message: 'El producto seleccionado no existe.' };
  }

  // 3. Validación de Stock para Salidas (Garantiza que no haya números negativos)
  if (type === 'OUT' && product.stock < qty) {
    return {
      success: false,
      message: `Stock insuficiente. Disponible: ${product.stock} unidades. Intentas retirar: ${qty}.`
    };
  }

  // 4. Actualización automática de Stock
  if (type === 'IN') {
    product.stock += qty;
  } else if (type === 'OUT') {
    product.stock -= qty;
  }

  // Guardar cambio en el producto en localStorage
  saveProduct(product);

  // 5. Registrar la transacción en el historial de movimientos
  const currentUser = getCurrentUser();
  const newMovement = {
    id: `MOV-${Date.now()}`,
    productId: product.id,
    type: type,
    quantity: qty,
    reason: reason ? reason.trim() : 'Sin motivo especificado',
    userId: currentUser ? currentUser.id : null,
    timestamp: new Date().toISOString()
  };

  addMovement(newMovement);

  return {
    success: true,
    message: `Movimiento registrado con éxito. Nuevo stock de "${product.name}": ${product.stock} unidades.`
  };
}

/**
 * Enriquece el historial de movimientos cruzando IDs con nombres de productos y usuarios.
 * @returns {Array} Lista de movimientos formateada para pintar en tablas.
 */
function getEnrichedMovements() {
  const movements = getMovements();
  const products = getProducts();
  const users = getFromStorage(STORAGE_KEYS.USERS);

  return movements.map(mov => {
    const prod = products.find(p => p.id === mov.productId);
    const user = users.find(u => u.id === mov.userId);

    return {
      ...mov,
      productName: prod ? prod.name : 'Producto Eliminado',
      userName: user ? user.name : 'Usuario Desconocido',
      formattedDate: new Date(mov.timestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  });
}

/**
 * Filtra los productos que se encuentran en o por debajo de su umbral de stock mínimo.
 * Exclusivo para el Panel de Estadísticas del Administrador.
 * @returns {Array} Productos con stock bajo.
 */
function getLowStockProducts() {
  const products = getProducts();
  return products.filter(p => p.stock <= p.minStock);
}

/**
 * Calcula cuál es el producto que ha generado mayor volumen de movimientos (entradas + salidas).
 * @returns {Object|null} Objeto con el producto y el total de unidades movidas.
 */
function getMostMovedProduct() {
  const movements = getMovements();
  const products = getProducts();

  if (movements.length === 0) return null;

  // Mapear acumulado de cantidades por productId
  const totalsMap = {};
  movements.forEach(m => {
    totalsMap[m.productId] = (totalsMap[m.productId] || 0) + m.quantity;
  });

  // Encontrar el productId con mayor total
  let topProductId = null;
  let maxQuantity = -1;

  for (const [prodId, totalQty] of Object.entries(totalsMap)) {
    if (totalQty > maxQuantity) {
      maxQuantity = totalQty;
      topProductId = prodId;
    }
  }

  const product = products.find(p => p.id === topProductId);
  return product ? { product, totalQuantity: maxQuantity } : null;
}