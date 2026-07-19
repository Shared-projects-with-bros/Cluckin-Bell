/*
 * Panel interno para HU10 (Gestionar pedidos recibidos).
 * No hay backend, asi que el acceso de administrador es una credencial fija
 * revisada aqui mismo. Cualquiera que vea el codigo fuente puede encontrarla:
 * esto alcanza para una demo/entrega academica, no para produccion real.
 */

const ORDERS_KEY = "cluckinOrders";
const ADMIN_SESSION_KEY = "cluckinAdminSession";
const ADMIN_CREDENTIALS = { correo: "admin@cluckinbell.local", password: "cluckinbell2026" };
const ORDER_STATUSES = ["Pendiente", "En preparacion", "En camino", "Entregado", "Cancelado"];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const getOrders = () => JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
const setOrders = (orders) => localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

const isAdminLoggedIn = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
const setAdminSession = (value) => {
  if (value) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
};

function orderCard(order) {
  const itemsList = order.items
    .map((item) => `<li>${item.cantidad} x ${item.nombre} - ${money.format(item.precio * item.cantidad)}</li>`)
    .join("");

  const fecha = new Date(order.fecha).toLocaleString("es-CR", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  const statusOptions = ORDER_STATUSES
    .map((status) => `<option value="${status}" ${status === order.estado ? "selected" : ""}>${status}</option>`)
    .join("");

  return `
    <article class="order-card">
      <div class="order-head">
        <span class="tag">#${order.codigo}</span>
        <select class="status-select" data-order-status="${order.codigo}" aria-label="Estado del pedido ${order.codigo}">
          ${statusOptions}
        </select>
      </div>
      <p class="order-date">${fecha}</p>
      <p class="order-client">${order.cliente.nombre} · ${order.cliente.telefono} · ${order.cliente.direccion}</p>
      <ul class="order-items">${itemsList}</ul>
      <strong class="price">${money.format(order.total)}</strong>
    </article>
  `;
}

function renderAdminOrders() {
  const container = document.querySelector("#admin-pedidos-lista");
  if (!container) return;

  const orders = getOrders();

  if (orders.length === 0) {
    container.innerHTML = `<p class="empty-state">Todavia no han llegado pedidos.</p>`;
    return;
  }

  container.innerHTML = orders.map(orderCard).join("");
}

function showAdminPanel() {
  document.querySelector("#adminLoginSection").hidden = true;
  document.querySelector("#adminOrdersSection").hidden = false;
  document.querySelector("#adminLogoutBtn").hidden = false;
  renderAdminOrders();
}

function showAdminLogin() {
  document.querySelector("#adminLoginSection").hidden = false;
  document.querySelector("#adminOrdersSection").hidden = true;
  document.querySelector("#adminLogoutBtn").hidden = true;
}

document.querySelector("#adminLoginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const correo = formData.get("correo").toString().trim().toLowerCase();
  const password = formData.get("password").toString();
  const message = document.querySelector("#adminLoginMessage");

  if (correo === ADMIN_CREDENTIALS.correo && password === ADMIN_CREDENTIALS.password) {
    setAdminSession(true);
    if (message) message.textContent = "";
    event.target.reset();
    showAdminPanel();
  } else if (message) {
    message.textContent = "Credenciales incorrectas.";
  }
});

document.querySelector("#adminLogoutBtn").addEventListener("click", () => {
  setAdminSession(false);
  showAdminLogin();
});

document.addEventListener("change", (event) => {
  const select = event.target.closest("[data-order-status]");
  if (!select) return;

  const orders = getOrders();
  const order = orders.find((entry) => entry.codigo === select.dataset.orderStatus);
  if (!order) return;

  order.estado = select.value;
  setOrders(orders);
});

if (isAdminLoggedIn()) {
  showAdminPanel();
} else {
  showAdminLogin();
}
