/**
 * app.js - Controlador Principal de la Interfaz de Usuario (UI)
 * Coordina el renderizado del DOM, modales, eventos y filtrado en tiempo real.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificar sesión activa y aplicar restricciones por rol
  protectRoute(['ADMIN', 'EMPLOYEE']);
  applyRolePermissions();

  // 2. Elementos del DOM - Listas y Tablas
  const productsTableBody = document.getElementById('products-table-body');
  const movementsTableBody = document.getElementById('movements-table-body');
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');

  // Elementos del DOM - Métricas Dashboard
  const statTotalProducts = document.getElementById('stat-total-products');
  const statLowStock = document.getElementById('stat-low-stock');
  const statTopProduct = document.getElementById('stat-top-product');
  const statTopProductQty = document.getElementById('stat-top-product-qty');

  // Elementos del DOM - Modales
  const modalProduct = document.getElementById('modal-product');
  const modalMovement = document.getElementById('modal-movement');
  const modalCategory = document.getElementById('modal-category');

  // Elementos del DOM - Formularios
  const formProduct = document.getElementById('form-product');
  const formMovement = document.getElementById('form-movement');
  const formCategory = document.getElementById('form-category');

  // Elementos del DOM - Selects dentro de formularios
  const prodCategorySelect = document.getElementById('prod-category');
  const movProductSelect = document.getElementById('mov-product');

  // Modos de formulario
  let isEditingProduct = false;

  // ==========================================
  // FUNCIONES DE RENDERIZADO
  // ==========================================

  /**
   * Carga y renderiza los selects de categorías en filtros y modales.
   */
  function renderCategoriesOptions() {
    const categories = getCategories();

    // Filtro principal de categorías
    categoryFilter.innerHTML = '<option value="">Todas las Categorías</option>';
    // Select en modal de producto
    prodCategorySelect.innerHTML = '<option value="">-- Selecciona Categoría --</option>';

    categories.forEach(cat => {
      const optFilter = document.createElement('option');
      optFilter.value = cat.id;
      optFilter.textContent = cat.name;
      categoryFilter.appendChild(optFilter);

      const optForm = document.createElement('option');
      optForm.value = cat.id;
      optForm.textContent = cat.name;
      prodCategorySelect.appendChild(optForm);
    });
  }

  /**
   * Renderiza la tabla de productos aplicando los filtros de búsqueda y categoría.
   */
  function renderProductsTable() {
    const products = getProducts();
    const categories = getCategories();
    const currentUser = getCurrentUser();

    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    // Filtrar la lista de productos
    const filteredProducts = products.filter(prod => {
      const matchesSearch = prod.name.toLowerCase().includes(searchTerm) || 
                            prod.id.toLowerCase().includes(searchTerm);
      const matchesCategory = selectedCategory === '' || String(prod.categoryId) === String(selectedCategory);

      return matchesSearch && matchesCategory;
    });

    productsTableBody.innerHTML = '';

    if (filteredProducts.length === 0) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-slate-400">
            No se encontraron productos con los criterios ingresados.
          </td>
        </tr>
      `;
      return;
    }

    // Dibujar filas de productos
    filteredProducts.forEach(prod => {
      const cat = categories.find(c => String(c.id) === String(prod.categoryId));
      const categoryName = cat ? cat.name : 'Sin Categoría';
      const isLowStock = prod.stock <= prod.minStock;

      // Badge de estado de stock
      const stockBadge = isLowStock
        ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <span class="w-1.5 h-1.5 rounded-full bg-red-600"></span> ${prod.stock} (Bajo)
           </span>`
        : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> ${prod.stock}
           </span>`;

      // Botones de acción según el Rol
      let actionsHtml = `
        <button data-id="${prod.id}" class="btn-quick-mov text-indigo-600 hover:text-indigo-900 font-medium text-xs px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
          ± Movimiento
        </button>
      `;

      if (currentUser && currentUser.role === 'ADMIN') {
        actionsHtml += `
          <button data-id="${prod.id}" class="btn-edit-prod text-amber-600 hover:text-amber-900 font-medium text-xs px-2 py-1 rounded hover:bg-amber-50 transition-colors ml-1">
            Editar
          </button>
          <button data-id="${prod.id}" class="btn-delete-prod text-red-600 hover:text-red-900 font-medium text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors ml-1">
            Eliminar
          </button>
        `;
      }

      const tr = document.createElement('tr');
      tr.className = isLowStock ? 'bg-amber-50/40 hover:bg-amber-50/80 transition-colors' : 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="p-4 font-mono font-medium text-xs text-slate-600">${prod.id}</td>
        <td class="p-4 font-semibold text-slate-800">${prod.name}</td>
        <td class="p-4 text-slate-500">${categoryName}</td>
        <td class="p-4 font-medium text-slate-700">$${Number(prod.price).toFixed(2)}</td>
        <td class="p-4">${stockBadge}</td>
        <td class="p-4 text-right">${actionsHtml}</td>
      `;

      productsTableBody.appendChild(tr);
    });
  }

  /**
   * Renderiza la tabla con el historial enriquecido de entradas y salidas.
   */
  function renderMovementsTable() {
    const movements = getEnrichedMovements();
    movementsTableBody.innerHTML = '';

    if (movements.length === 0) {
      movementsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-slate-400">
            No hay movimientos registrados en el historial.
          </td>
        </tr>
      `;
      return;
    }

    movements.forEach(mov => {
      const isEntry = mov.type === 'IN';
      const typeBadge = isEntry
        ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">ENTRADA</span>`
        : `<span class="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">SALIDA</span>`;

      const qtyDisplay = isEntry 
        ? `<span class="text-emerald-600 font-semibold">+${mov.quantity}</span>`
        : `<span class="text-rose-600 font-semibold">-${mov.quantity}</span>`;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="p-4 text-xs text-slate-500">${mov.formattedDate}</td>
        <td class="p-4">${typeBadge}</td>
        <td class="p-4 font-medium text-slate-800">${mov.productName}</td>
        <td class="p-4 font-mono text-sm">${qtyDisplay}</td>
        <td class="p-4 text-slate-600 text-xs">${mov.reason}</td>
        <td class="p-4 text-slate-500 text-xs font-medium">${mov.userName}</td>
      `;

      movementsTableBody.appendChild(tr);
    });
  }

  /**
   * Actualiza el panel de métricas y estadísticas principales para el Administrador.
   */
  function renderStats() {
    const products = getProducts();
    const lowStockProds = getLowStockProducts();
    const topProdData = getMostMovedProduct();

    if (statTotalProducts) statTotalProducts.textContent = products.length;
    if (statLowStock) statLowStock.textContent = lowStockProds.length;

    if (statTopProduct && statTopProductQty) {
      if (topProdData && topProdData.product) {
        statTopProduct.textContent = topProdData.product.name;
        statTopProductQty.textContent = `${topProdData.totalQuantity} unidades transferidas`;
      } else {
        statTopProduct.textContent = 'Sin datos';
        statTopProductQty.textContent = '0 unidades';
      }
    }
  }

  /**
   * Carga los productos disponibles en el select del modal de movimientos.
   */
  function populateMovementProductSelect() {
    const products = getProducts();
    movProductSelect.innerHTML = '<option value="">-- Selecciona un Producto --</option>';

    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (Stock actual: ${p.stock})`;
      movProductSelect.appendChild(opt);
    });
  }

  /**
   * Refresca todos los componentes visuales de la aplicación.
   */
  function refreshUI() {
    renderCategoriesOptions();
    renderProductsTable();
    renderMovementsTable();
    renderStats();
  }

  // ==========================================
  // MANEJO DE MODALES
  // ==========================================

  function openModal(modalEl) {
    modalEl.classList.remove('hidden');
  }

  function closeModal(modalEl) {
    modalEl.classList.add('hidden');
  }

  // Evento global para cerrar modales mediante los botones de cancelar/cerrar
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(modalProduct);
      closeModal(modalMovement);
      closeModal(modalCategory);
    });
  });

  // Botón Abrir Modal Nuevo Producto (ADMIN)
  const btnOpenProductModal = document.getElementById('btn-open-product-modal');
  if (btnOpenProductModal) {
    btnOpenProductModal.addEventListener('click', () => {
      isEditingProduct = false;
      formProduct.reset();
      document.getElementById('modal-product-title').textContent = 'Nuevo Producto';
      document.getElementById('prod-code').readOnly = false;
      openModal(modalProduct);
    });
  }

  // Botón Abrir Modal Movimientos
  const btnOpenMovementModal = document.getElementById('btn-open-movement-modal');
  if (btnOpenMovementModal) {
    btnOpenMovementModal.addEventListener('click', () => {
      formMovement.reset();
      populateMovementProductSelect();
      openModal(modalMovement);
    });
  }

  // Botón Abrir Modal Categoría (ADMIN)
  const btnOpenCategoryModal = document.getElementById('btn-open-category-modal');
  if (btnOpenCategoryModal) {
    btnOpenCategoryModal.addEventListener('click', () => {
      formCategory.reset();
      openModal(modalCategory);
    });
  }

  // ==========================================
  // PROCESAMIENTO DE FORMULARIOS
  // ==========================================

  // Formulario: Crear / Editar Producto
  formProduct.addEventListener('submit', (e) => {
    e.preventDefault();

    const productData = {
      id: document.getElementById('prod-code').value.trim().toUpperCase(),
      name: document.getElementById('prod-name').value.trim(),
      categoryId: Number(document.getElementById('prod-category').value),
      price: parseFloat(document.getElementById('prod-price').value),
      stock: parseInt(document.getElementById('prod-stock').value, 10),
      minStock: parseInt(document.getElementById('prod-min-stock').value, 10)
    };

    saveProduct(productData);
    closeModal(modalProduct);
    refreshUI();
  });

  // Formulario: Registrar Movimiento
  formMovement.addEventListener('submit', (e) => {
    e.preventDefault();

    const movementData = {
      productId: document.getElementById('mov-product').value,
      type: document.getElementById('mov-type').value,
      quantity: document.getElementById('mov-quantity').value,
      reason: document.getElementById('mov-reason').value
    };

    const result = registerMovement(movementData);

    if (result.success) {
      closeModal(modalMovement);
      refreshUI();
    } else {
      alert(result.message);
    }
  });

  // Formulario: Crear Categoría
  formCategory.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('cat-name').value.trim();
    if (!name) return;

    saveCategory({ id: Date.now(), name });
    closeModal(modalCategory);
    refreshUI();
  });

  // ==========================================
  // EVENTOS DE TABLA (EDICIÓN, ELIMINACIÓN Y MOVIMIENTO RÁPIDO)
  // ==========================================

  productsTableBody.addEventListener('click', (e) => {
    const target = e.target;
    const productId = target.getAttribute('data-id');

    if (!productId) return;

    // Acción: Eliminar Producto
    if (target.classList.contains('btn-delete-prod')) {
      if (confirm(`¿Estás seguro de eliminar el producto ${productId}?`)) {
        deleteProduct(productId);
        refreshUI();
      }
    }

    // Acción: Editar Producto
    if (target.classList.contains('btn-edit-prod')) {
      const prod = getProductById(productId);
      if (!prod) return;

      isEditingProduct = true;
      document.getElementById('modal-product-title').textContent = `Editar Producto: ${prod.name}`;
      document.getElementById('prod-code').value = prod.id;
      document.getElementById('prod-code').readOnly = true; // No permitir cambiar el ID
      document.getElementById('prod-name').value = prod.name;
      document.getElementById('prod-category').value = prod.categoryId;
      document.getElementById('prod-price').value = prod.price;
      document.getElementById('prod-stock').value = prod.stock;
      document.getElementById('prod-min-stock').value = prod.minStock;

      openModal(modalProduct);
    }

    // Acción: Movimiento Rápido sobre un producto
    if (target.classList.contains('btn-quick-mov')) {
      formMovement.reset();
      populateMovementProductSelect();
      movProductSelect.value = productId;
      openModal(modalMovement);
    }
  });

  // ==========================================
  // EVENTOS EN TIEMPO REAL & CERRAR SESIÓN
  // ==========================================

  // Filtro de búsqueda y categoría
  searchInput.addEventListener('input', renderProductsTable);
  categoryFilter.addEventListener('change', renderProductsTable);

  // Cierre de Sesión
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', logout);
  }

  // Carga Inicial
  refreshUI();
});