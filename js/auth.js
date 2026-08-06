/**
 * auth.js - Módulo de Autenticación y Control de Accesos (RBAC)
 * Gestiona la sesión activa en localStorage y la visibilidad según roles.
 */

/**
 * Obtiene el usuario actualmente autenticado desde localStorage.
 * @returns {Object|null} Objeto usuario o null si no hay sesión activa.
 */
function getCurrentUser() {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
}

/**
 * Inicia sesión dado un username ("admin" o "empleado").
 * @param {string} username 
 * @returns {boolean} true si el login fue exitoso, false si falló.
 */
function login(username) {
  const users = getFromStorage(STORAGE_KEYS.USERS);
  const foundUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

  if (foundUser) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(foundUser));
    return true;
  }
  return false;
}

/**
 * Cierra la sesión activa y redirige al index.html (pantalla de login).
 */
function logout() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  window.location.href = 'index.html';
}

/**
 * Guard de navegación: Protege páginas completas verificando si el usuario
 * ha iniciado sesión y si tiene un rol permitido.
 * @param {Array<string>} allowedRoles Ej: ['ADMIN', 'EMPLOYEE'] o solo ['ADMIN']
 */
function protectRoute(allowedRoles = []) {
  const currentUser = getCurrentUser();

  // 1. Si no hay usuario logueado, redirigir al login
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  // 2. Si la ruta requiere un rol específico y el usuario no lo cumple
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    alert('Acceso no autorizado: Tu rol no tiene permisos para ver esta vista.');
    window.location.href = 'dashboard.html';
  }
}

/**
 * Ajusta la visibilidad de elementos en el DOM según el rol del usuario logueado.
 * Oculta elementos marcados con data-role="ADMIN" si el usuario es "EMPLOYEE".
 */
function applyRolePermissions() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  // Actualizar indicador visual de usuario en la barra superior/header
  const userInfoEl = document.getElementById('user-info-display');
  if (userInfoEl) {
    userInfoEl.textContent = `${currentUser.name} (${currentUser.role})`;
  }

  // Si el usuario es EMPLEADO, ocultar/deshabilitar acciones exclusivas de ADMIN
  if (currentUser.role === 'EMPLOYEE') {
    // Busca todos los elementos HTML marcados con data-role="ADMIN" y los oculta
    const adminElements = document.querySelectorAll('[data-role="ADMIN"]');
    adminElements.forEach(el => {
      el.style.display = 'none';
    });
  }
}