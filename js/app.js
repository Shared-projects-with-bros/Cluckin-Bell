const API_BASE = "http://localhost:3000/api";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

/* ---------- Menu (cargado desde el backend) ---------- */

let menu = [];

async function loadMenu() {
  try {
    const response = await fetch(`${API_BASE}/productos`);
    if (!response.ok) throw new Error("No se pudo cargar el menu");
    menu = await response.json();
  } catch (error) {
    console.error(error);
    menu = [];
  }
}

/* ---------- Cuentas de usuario (backend) ---------- */

const SESSION_KEY = "cluckinSession";

const getSession = () => JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
const setSession = (session) => {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

/* El carrito y los pedidos se identifican por el correo de la sesion activa,
   no por el navegador: asi cada cuenta ve solo lo suyo aunque compartan equipo. */
function currentClienteId() {
  const session = getSession();
  return session ? session.correo : null;
}

let pendingCartAction = null;

/* ---------- Contadores del navbar ---------- */

function renderCartCount(cart) {
  const totalItems = cart.items.reduce((total, item) => total + item.cantidad, 0);
  document.querySelectorAll(".cart-count").forEach((counter) => {
    counter.textContent = totalItems;
  });
}

/* ---------- Carrito (backend) ---------- */

async function getCartData() {
  const clienteId = currentClienteId();
  if (!clienteId) return { clienteId: null, items: [], total: 0 };

  const response = await fetch(`${API_BASE}/carrito/${encodeURIComponent(clienteId)}`);
  if (!response.ok) throw new Error("No se pudo obtener el carrito");
  return response.json();
}

/* ---------- HU4: Agregar productos al carrito ---------- */

async function addToCart(productId, quantity = 1) {
  const clienteId = currentClienteId();
  if (!clienteId) return;

  const safeQuantity = Math.max(1, Math.floor(Number(quantity)) || 1);

  await fetch(`${API_BASE}/carrito/${encodeURIComponent(clienteId)}/agregar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productoId: productId, cantidad: safeQuantity })
  });

  await renderCart();
}

/* ---------- HU5: Gestionar carrito de compras ---------- */

async function updateCartQuantity(productId, quantity) {
  const clienteId = currentClienteId();
  if (!clienteId) return;

  const safeQuantity = Math.max(0, Math.floor(Number(quantity)) || 0);

  await fetch(`${API_BASE}/carrito/${encodeURIComponent(clienteId)}/item/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cantidad: safeQuantity })
  });

  await renderCart();
}

async function removeFromCart(productId) {
  const clienteId = currentClienteId();
  if (!clienteId) return;

  await fetch(`${API_BASE}/carrito/${encodeURIComponent(clienteId)}/item/${productId}`, {
    method: "DELETE"
  });

  await renderCart();
}

/* ---------- Tarjetas de producto (menu / favoritos) ---------- */

function productCard(product) {
  return `
    <article class="product-card">
      <button class="product-hit" type="button" data-open-product="${product.id}">
        <div class="product-image">
          <img src="${product.img}" alt="${product.nombre}">
        </div>
        <div class="product-body">
          <h3>${product.nombre}</h3>
          <p>${product.descripcion}</p>
          <strong class="price">${money.format(product.precio)}</strong>
        </div>
      </button>
      <div class="card-actions">
        <a class="btn secondary" href="detalle_producto.html?id=${product.id}">Ver detalle</a>
        <div class="qty-add-row">
          <label class="quantity-control compact">
            <span class="sr-only">Cantidad</span>
            <input type="number" min="1" max="20" value="1" data-quantity-for="${product.id}" aria-label="Cantidad de ${product.nombre}">
          </label>
          <button class="btn primary" type="button" data-add-cart="${product.id}">Agregar al carrito</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(containerId, products) {
  const container = document.querySelector(containerId);
  if (!container) return;
  container.innerHTML = products.map(productCard).join("");
}

/* ---------- Modal de detalle rapido (HU2) ---------- */

function openProductModal(productId) {
  const product = menu.find((item) => item.id === productId);
  const modal = document.querySelector("#productModal");
  if (!product || !modal) return;

  document.querySelector("#modalImg").src = product.img;
  document.querySelector("#modalImg").alt = product.nombre;
  document.querySelector("#modalTitle").textContent = product.nombre;
  document.querySelector("#modalDescription").textContent = product.descripcion;
  document.querySelector("#modalIngredients").textContent = `Ingredientes: ${product.ingredientes}`;
  document.querySelector("#modalPrice").textContent = money.format(product.precio);
  document.querySelector("#modalDetailLink").href = `detalle_producto.html?id=${product.id}`;
  document.querySelector("#modalAddCart").dataset.addCart = product.id;
  document.querySelector("#modalQuantity").value = 1;
  document.querySelector("#modalQuantity").dataset.quantityFor = product.id;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModals() {
  document.querySelectorAll(".modal.is-open").forEach((modal) => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  });
}

/* ---------- Pagina de detalle completo ---------- */

function renderDetailPage() {
  const detail = document.querySelector("#detalle-producto");
  if (!detail) return;

  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id")) || 1;
  const product = menu.find((item) => item.id === id);

  if (!product) {
    detail.innerHTML = `<p class="empty-state">Producto no encontrado. Vuelve al menu para elegir otro combo.</p>`;
    return;
  }

  detail.innerHTML = `
    <div class="detail-media">
      <img src="${product.img}" alt="${product.nombre}">
    </div>
    <div class="detail-copy">
      <p class="eyebrow">Detalle del producto</p>
      <h1>${product.nombre}</h1>
      <p>${product.descripcion}</p>
      <p class="ingredients">Ingredientes: ${product.ingredientes}</p>
      <strong class="price">${money.format(product.precio)}</strong>
      <div class="detail-actions">
        <a class="btn secondary" href="menu.html">Volver al menu</a>
      </div>
      <div class="qty-add-row detail-quantity">
        <label class="quantity-control compact">
          <span class="sr-only">Cantidad</span>
          <input type="number" min="1" max="20" value="1" data-quantity-for="${product.id}" aria-label="Cantidad de ${product.nombre}">
        </label>
        <button class="btn primary" type="button" data-add-cart="${product.id}">Agregar al carrito</button>
      </div>
    </div>
  `;
}

/* ---------- Carrito (pagina) ---------- */

async function renderCart() {
  const list = document.querySelector("#carrito-lista");
  const total = document.querySelector("#carrito-total");

  if (!currentClienteId()) {
    renderCartCount({ items: [] });
    if (list && total) {
      list.innerHTML = `<p class="empty-state">Inicia sesion para ver tu carrito.</p>`;
      total.textContent = money.format(0);
    }
    return { items: [], total: 0 };
  }

  const cart = await getCartData();
  renderCartCount(cart);

  if (!list || !total) return cart;

  if (cart.items.length === 0) {
    list.innerHTML = `<p class="empty-state">El carrito esta vacio. Agrega un producto desde el menu.</p>`;
    total.textContent = money.format(0);
    return cart;
  }

  list.innerHTML = cart.items.map((item) => `
      <article class="cart-item">
        <img src="${item.img}" alt="${item.nombre}">
        <div class="cart-item-info">
          <h3>${item.nombre}</h3>
          <label class="quantity-control cart-quantity">
            <span>Cantidad</span>
            <input type="number" min="1" max="20" value="${item.cantidad}" data-cart-quantity-for="${item.productoId}" aria-label="Cantidad de ${item.nombre} en el carrito">
          </label>
          <strong class="price">${money.format(item.subtotal)}</strong>
        </div>
        <button class="btn secondary" type="button" data-remove-cart="${item.productoId}">Quitar</button>
      </article>
    `).join("");

  total.textContent = money.format(cart.total);
  return cart;
}

/* ---------- HU6: Realizar pedido (checkout) ---------- */

async function renderCheckoutSummary() {
  const container = document.querySelector("#checkoutSummary");
  if (!container) return;

  const cart = await getCartData();

  container.innerHTML = `
    <ul class="checkout-summary-list">
      ${cart.items.map((item) => `<li><span>${item.cantidad} x ${item.nombre}</span><span>${money.format(item.subtotal)}</span></li>`).join("")}
    </ul>
    <div class="checkout-summary-total">
      <span>Total</span>
      <strong>${money.format(cart.total)}</strong>
    </div>
  `;
}

async function openCheckoutModal() {
  const modal = document.querySelector("#checkoutModal");
  if (!modal) return;
  await renderCheckoutSummary();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function setupCheckout() {
  const checkoutForm = document.querySelector("#checkoutForm");
  if (!checkoutForm) return;

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const clienteId = currentClienteId();
    const cartMessage = document.querySelector("#carritoMensaje");

    if (!clienteId) {
      closeModals();
      return;
    }

    const cart = await getCartData();

    if (cart.items.length === 0) {
      closeModals();
      return;
    }

    const formData = new FormData(checkoutForm);
    const nombre = formData.get("nombre").toString().trim();
    const telefono = formData.get("telefono").toString().trim();
    const direccion = formData.get("direccion").toString().trim();

    try {
      const response = await fetch(`${API_BASE}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          cliente: { nombre, telefono, direccion }
        })
      });

      if (!response.ok) throw new Error("No se pudo crear el pedido");
      const pedido = await response.json();

      await renderOrders();
      await renderCart();

      checkoutForm.reset();
      closeModals();

      if (cartMessage) {
        cartMessage.textContent = `Pedido confirmado. Tu codigo de seguimiento es ${pedido.codigo}. Puedes verlo en "Pedidos Pendientes".`;
      }
    } catch (error) {
      console.error(error);
      if (cartMessage) {
        cartMessage.textContent = "Ocurrio un error al confirmar el pedido. Intenta de nuevo.";
      }
    }
  });
}

/* ---------- Pagina de pedidos pendientes ---------- */

async function getOrdersData() {
  const clienteId = currentClienteId();
  if (!clienteId) return [];

  const response = await fetch(`${API_BASE}/pedidos/${encodeURIComponent(clienteId)}`);
  if (!response.ok) throw new Error("No se pudieron obtener los pedidos");
  return response.json();
}

function renderOrdersCount(orders) {
  document.querySelectorAll(".orders-count").forEach((counter) => {
    counter.textContent = orders.length;
  });
}

async function renderOrders() {
  const container = document.querySelector("#pedidos-lista");

  if (!currentClienteId()) {
    renderOrdersCount([]);
    if (container) {
      container.innerHTML = `<p class="empty-state">Inicia sesion para ver tus pedidos pendientes.</p>`;
    }
    return;
  }

  let orders = [];
  try {
    orders = await getOrdersData();
  } catch (error) {
    console.error(error);
  }

  renderOrdersCount(orders);

  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<p class="empty-state">Aun no tienes pedidos pendientes. Finaliza una compra desde el carrito para generar un codigo.</p>`;
    return;
  }

  container.innerHTML = orders.map((order) => {
    const itemsList = order.items
      .map((item) => `<li>${item.cantidad} x ${item.nombre} - ${money.format(item.precio * item.cantidad)}</li>`)
      .join("");

    const fecha = new Date(order.createdAt).toLocaleString("es-CR", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    return `
      <article class="order-card">
        <div class="order-head">
          <span class="tag">#${order.codigo}</span>
          <span class="order-status">${order.estado}</span>
        </div>
        <p class="order-date">${fecha}</p>
        <p class="order-client">${order.cliente.nombre} · ${order.cliente.telefono} · ${order.cliente.direccion}</p>
        <ul class="order-items">${itemsList}</ul>
        <strong class="price">${money.format(order.total)}</strong>
      </article>
    `;
  }).join("");
}

/* ---------- Cuenta de usuario (HU8/HU9): widget e inicio de sesion ---------- */

function injectAccountUI() {
  const nav = document.querySelector(".navbar");
  if (nav && !document.querySelector("#accountWidget")) {
    const widget = document.createElement("div");
    widget.className = "account-widget";
    widget.id = "accountWidget";
    widget.innerHTML = `
      <button class="account-trigger" id="accountTrigger" type="button" aria-haspopup="true" aria-expanded="false">Iniciar sesion</button>
      <div class="account-menu" id="accountMenu" hidden></div>
    `;
    nav.appendChild(widget);
  }

  if (!document.querySelector("#authModal")) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "authModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="modal-dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle">
        <button class="modal-close" type="button" data-close-modal aria-label="Cerrar formulario de cuenta">x</button>
        <div>
          <p class="eyebrow" id="authTitle">Mi cuenta</p>
          <p class="form-message auth-notice" id="authNotice"></p>
          <div class="auth-tabs">
            <button type="button" class="auth-tab is-active" data-auth-tab="login">Iniciar sesion</button>
            <button type="button" class="auth-tab" data-auth-tab="register">Crear cuenta</button>
          </div>
          <form class="reservation-form auth-form" id="loginForm">
            <label class="full-field">Correo<input type="email" name="correo" placeholder="tu@correo.com" required></label>
            <label class="full-field">Contrasena<input type="password" name="password" required></label>
            <button class="btn primary full-field" type="submit">Entrar</button>
            <p class="form-message full-field" id="loginMessage" role="status" aria-live="polite"></p>
          </form>
          <form class="reservation-form auth-form" id="registerForm" hidden>
            <label class="full-field">Nombre<input type="text" name="nombre" placeholder="Tu nombre" required></label>
            <label class="full-field">Correo<input type="email" name="correo" placeholder="tu@correo.com" required></label>
            <label class="full-field">Contrasena<input type="password" name="password" minlength="4" required></label>
            <button class="btn primary full-field" type="submit">Crear cuenta</button>
            <p class="form-message full-field" id="registerMessage" role="status" aria-live="polite"></p>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

function updateNavVisibility() {
  const session = getSession();
  document
    .querySelectorAll('a.cart-link[href="carrito.html"], a.cart-link[href="pedidos.html"]')
    .forEach((link) => {
      link.hidden = !session;
    });
}

function renderAccountWidget() {
  const trigger = document.querySelector("#accountTrigger");
  const menuEl = document.querySelector("#accountMenu");
  if (!trigger || !menuEl) return;

  const session = getSession();
  updateNavVisibility();

  if (session) {
    trigger.textContent = session.nombre.split(" ")[0];
    trigger.classList.add("is-logged");
    menuEl.innerHTML = `
      <span class="account-menu-name">${session.nombre}</span>
      <a href="pedidos.html">Ver pedidos pendientes</a>
      <button type="button" id="logoutBtn">Cerrar sesion</button>
    `;
  } else {
    trigger.textContent = "Iniciar sesion";
    trigger.classList.remove("is-logged");
    menuEl.innerHTML = "";
    menuEl.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }
}

function switchAuthTab(tab) {
  const loginForm = document.querySelector("#loginForm");
  const registerForm = document.querySelector("#registerForm");
  if (!loginForm || !registerForm) return;

  document.querySelectorAll("[data-auth-tab]").forEach((tabButton) => {
    tabButton.classList.toggle("is-active", tabButton.dataset.authTab === tab);
  });

  loginForm.hidden = tab !== "login";
  registerForm.hidden = tab !== "register";
}

function openAuthModal(tab, notice) {
  const modal = document.querySelector("#authModal");
  if (!modal) return;
  switchAuthTab(tab || "login");
  const noticeEl = document.querySelector("#authNotice");
  if (noticeEl) noticeEl.textContent = notice || "";
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeAccountMenu() {
  const menuEl = document.querySelector("#accountMenu");
  const trigger = document.querySelector("#accountTrigger");
  if (menuEl) menuEl.hidden = true;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
  const menuEl = document.querySelector("#accountMenu");
  const trigger = document.querySelector("#accountTrigger");
  if (!menuEl || !trigger) return;
  const willOpen = menuEl.hidden;
  menuEl.hidden = !willOpen;
  trigger.setAttribute("aria-expanded", String(willOpen));
}

function setupAuth() {
  const loginForm = document.querySelector("#loginForm");
  const registerForm = document.querySelector("#registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const correo = formData.get("correo").toString().trim().toLowerCase();
      const password = formData.get("password").toString();
      const message = document.querySelector("#loginMessage");

      try {
        const response = await fetch(`${API_BASE}/usuarios/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, password })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          if (message) message.textContent = data.error || "Correo o contrasena incorrectos.";
          return;
        }

        const user = await response.json();
        setSession({ nombre: user.nombre, correo: user.correo });
        renderAccountWidget();
        loginForm.reset();
        if (message) message.textContent = "";
        closeModals();
        resolvePendingCartAction();
        renderCart();
        renderOrders();
      } catch (error) {
        console.error(error);
        if (message) message.textContent = "No se pudo conectar con el servidor.";
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(registerForm);
      const nombre = formData.get("nombre").toString().trim();
      const correo = formData.get("correo").toString().trim().toLowerCase();
      const password = formData.get("password").toString();
      const message = document.querySelector("#registerMessage");

      try {
        const response = await fetch(`${API_BASE}/usuarios/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, correo, password })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          if (message) message.textContent = data.error || "No se pudo crear la cuenta.";
          return;
        }

        const user = await response.json();
        setSession({ nombre: user.nombre, correo: user.correo });
        renderAccountWidget();
        registerForm.reset();
        if (message) message.textContent = "";
        closeModals();
        resolvePendingCartAction();
        renderCart();
        renderOrders();
      } catch (error) {
        console.error(error);
        if (message) message.textContent = "No se pudo conectar con el servidor.";
      }
    });
  }
}

function resolvePendingCartAction() {
  if (!pendingCartAction) return;
  addToCart(pendingCartAction.productId, pendingCartAction.quantity);
  pendingCartAction = null;
}

/* ---------- Utilidades varias ---------- */

function getSelectedQuantity(addButton) {
  const productId = addButton.dataset.addCart;
  const scope = addButton.closest(".product-card, .modal-dialog, .detail-copy") || document;
  const input = scope.querySelector(`[data-quantity-for="${productId}"]`);
  return input ? input.value : 1;
}

function setupNavigation() {
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function normalizeText(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function setupMenuSearch() {
  const input = document.querySelector("#menuSearchInput");
  const status = document.querySelector("#menuSearchStatus");
  if (!input) return;

  input.addEventListener("input", () => {
    const query = normalizeText(input.value);
    const results = query
      ? menu.filter((product) => normalizeText(product.nombre).includes(query))
      : menu;

    renderProducts("#contenedor-menu", results);

    if (!status) return;
    status.textContent = query && results.length === 0
      ? `No se encontraron productos para "${input.value.trim()}".`
      : "";
  });
}

function setupReservation() {
  const reservationForm = document.querySelector("#reservationForm");
  if (!reservationForm) return;
  const formMessage = reservationForm.querySelector(".form-message");

  reservationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(reservationForm);
    const name = formData.get("name").toString().trim();
    const people = formData.get("people");
    const date = formData.get("date");
    if (formMessage) {
      formMessage.textContent = `Gracias, ${name}. Tu reserva para ${people} personas queda solicitada para el ${date}.`;
    }
    reservationForm.reset();
  });
}

/* ---------- Eventos globales ---------- */

document.addEventListener("click", async (event) => {
  const openButton = event.target.closest("[data-open-product]");
  const addButton = event.target.closest("[data-add-cart]");
  const removeButton = event.target.closest("[data-remove-cart]");
  const closeButton = event.target.closest("[data-close-modal]");
  const finalizeButton = event.target.closest("#btnFinalizarPedido");
  const accountTrigger = event.target.closest("#accountTrigger");
  const authTab = event.target.closest("[data-auth-tab]");
  const logoutButton = event.target.closest("#logoutBtn");
  const accountWidget = event.target.closest("#accountWidget");

  if (openButton) {
    openProductModal(Number(openButton.dataset.openProduct));
  }

  if (addButton) {
    const quantity = getSelectedQuantity(addButton);
    const productId = Number(addButton.dataset.addCart);

    if (!getSession()) {
      pendingCartAction = { productId, quantity };
      openAuthModal("login", "Inicia sesion para agregar productos al carrito.");
    } else {
      addToCart(productId, quantity);
      addButton.textContent = "Agregado";
      setTimeout(() => {
        addButton.textContent = "Agregar al carrito";
      }, 900);
    }
  }

  if (removeButton) {
    removeFromCart(Number(removeButton.dataset.removeCart));
  }

  if (finalizeButton) {
    const cartMessage = document.querySelector("#carritoMensaje");
    const cart = await getCartData();

    if (cart.items.length === 0) {
      if (cartMessage) {
        cartMessage.textContent = "Agrega al menos un producto antes de finalizar el pedido.";
      }
      return;
    }

    if (cartMessage) {
      cartMessage.textContent = "";
    }
    await openCheckoutModal();
  }

  if (closeButton || event.target.classList.contains("modal")) {
    pendingCartAction = null;
    closeModals();
  }

  if (accountTrigger) {
    if (getSession()) {
      toggleAccountMenu();
    } else {
      pendingCartAction = null;
      openAuthModal("login");
    }
  }

  if (authTab) {
    switchAuthTab(authTab.dataset.authTab);
  }

  if (logoutButton) {
    setSession(null);
    renderAccountWidget();
    renderCart();
    renderOrders();
  }

  if (!accountWidget) {
    closeAccountMenu();
  }
});

document.addEventListener("change", (event) => {
  const cartQuantityInput = event.target.closest("[data-cart-quantity-for]");
  if (cartQuantityInput) {
    updateCartQuantity(Number(cartQuantityInput.dataset.cartQuantityFor), cartQuantityInput.value);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModals();
    closeAccountMenu();
  }
});

/* ---------- Inicializacion ---------- */

async function init() {
  injectAccountUI();
  setupNavigation();
  setupReservation();
  setupCheckout();
  setupAuth();

  await loadMenu();

  setupMenuSearch();
  renderProducts("#contenedor-menu", menu);
  renderProducts("#favoritos-lista", menu.filter((product) => product.favorito));
  renderProducts("#destacados-lista", menu.filter((product) => product.favorito));
  renderDetailPage();

  renderAccountWidget();

  try {
    await renderCart();
  } catch (error) {
    console.error(error);
  }

  try {
    await renderOrders();
  } catch (error) {
    console.error(error);
  }
}

init();
