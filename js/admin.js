/*
 * Panel interno para HU10 (Gestionar pedidos recibidos).
 * No hay backend de autenticacion admin, asi que el acceso es una credencial
 * fija revisada aqui mismo. Cualquiera que vea el codigo fuente puede
 * encontrarla: esto alcanza para una demo/entrega academica, no para
 * produccion real.
 */

const API_BASE = "http://localhost:3000/api";

const ADMIN_SESSION_KEY = "cluckinAdminSession";
const ADMIN_CREDENTIALS = { correo: "admin@cluckinbell.local", password: "cluckinbell2026" };
const ORDER_STATUSES = ["Pendiente", "En preparacion", "En camino", "Entregado", "Cancelado"];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

async function getOrders() {
  const response = await fetch(`${API_BASE}/pedidos`);
  if (!response.ok) throw new Error("No se pudieron obtener los pedidos");
  return response.json();
}

async function updateOrderStatus(codigo, estado) {
  const response = await fetch(`${API_BASE}/pedidos/${codigo}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });
  if (!response.ok) throw new Error("No se pudo actualizar el estado del pedido");
  return response.json();
}

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

  const fecha = new Date(order.createdAt).toLocaleString("es-CR", {
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

async function renderAdminOrders() {
  const container = document.querySelector("#admin-pedidos-lista");
  if (!container) return;

  try {
    const orders = await getOrders();

    if (orders.length === 0) {
      container.innerHTML = `<p class="empty-state">Todavia no han llegado pedidos.</p>`;
      return;
    }

    container.innerHTML = orders.map(orderCard).join("");
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="empty-state">No se pudieron cargar los pedidos. Verifica que el servidor este corriendo.</p>`;
  }
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

document.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-order-status]");
  if (!select) return;

  try {
    await updateOrderStatus(select.dataset.orderStatus, select.value);
  } catch (error) {
    console.error(error);
  }
});

if (isAdminLoggedIn()) {
  showAdminPanel();
} else {
  showAdminLogin();
}
