const menu = [
  {
    id: 1,
    nombre: "Oreja de Pollo",
    precio: 3.5,
    descripcion: "Crujiente y jugosa oreja de pollo empanizada, acompañada de papas fritas y salsa especial.",
    ingredientes: "Oreja de pollo, pan rallado, especias, papas fritas, salsa especial.",
    img: "img/orejadepollo.png",
    favorito: true
  },
  {
    id: 2,
    nombre: "Ala de Cerdo",
    precio: 6.99,
    descripcion: "Tres piezas de cerdo empanizadas, acompañadas de salsa especial y bebida pequeña",
    ingredientes: "Ala de cerdo, pan rallado, especias, salsa especial, bebida pequeña.",
    img: "img/aladecerdo.png",
    favorito: true
  },
  {
    id: 3,
    nombre: "DinoRico",
    precio: 99.99,
    descripcion: "Para los que gustan de algo prehistorico.",
    ingredientes: "Compy entero, una cuchara de sal volcanica, Jugo de limon de la era de hielo, huevo de giganoto, aceite de pablo, LA CEBOLLA",
    img: "img/Dinorico.png",
    favorito: true
  },
  {
    id: 4,
    nombre: "Pata de Pescado",
    precio: 12.9,
    descripcion: "Pata de pescado empanizada acompañada de ensalada, salsa de ajo y papas fritas, salsa de rábano",
    ingredientes: "Pata de pescado, especias, ensalada, salsa de ajo, papas fritas.",
    img: "img/patadepescado.png",
    favorito: true
  },
  {
    id: 5,
    nombre: "Hot Wings San Andreas",
    precio: 5.75,
    descripcion: "Alitas picantes banadas en salsa roja con un toque dulce y ahumado.",
    ingredientes: "Seis alitas, salsa picante, aderezo ranch, apio, papas pequenas y bebida.",
    img: "img/Cluckin bell.png",
    favorito: false
  },
  {
    id: 6,
    nombre: "Cluckin Strips",
    precio: 4.8,
    descripcion: "Tiras de pollo crujiente perfectas para banar en salsa especial.",
    ingredientes: "Cinco tiras de pollo, papas medianas, salsa miel mostaza y bebida regular.",
    img: "img/Cluckin bell.png",
    favorito: false
  }
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const CART_KEY = "cluckinCart";
const ORDERS_KEY = "cluckinOrders";

/* ---------- Carrito (almacenamiento) ---------- */

const getCart = () => JSON.parse(localStorage.getItem(CART_KEY)) || [];
const setCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

/* ---------- Pedidos pendientes (almacenamiento) ---------- */

const getOrders = () => JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
const setOrders = (orders) => localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

function generateOrderCode(existingCodes) {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (existingCodes.includes(code));
  return code;
}

/* ---------- Contadores del navbar ---------- */

function updateCartCount() {
  const totalItems = getCart().reduce((total, item) => total + item.cantidad, 0);
  document.querySelectorAll(".cart-count").forEach((counter) => {
    counter.textContent = totalItems;
  });
}

function updateOrdersCount() {
  const totalOrders = getOrders().length;
  document.querySelectorAll(".orders-count").forEach((counter) => {
    counter.textContent = totalOrders;
  });
}

/* ---------- HU4: Agregar productos al carrito ---------- */

function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const current = cart.find((item) => item.id === productId);
  const safeQuantity = Math.max(1, Math.floor(Number(quantity)) || 1);

  if (current) {
    current.cantidad += safeQuantity;
  } else {
    cart.push({ id: productId, cantidad: safeQuantity });
  }

  setCart(cart);
  updateCartCount();
  renderCart();
}

/* ---------- HU5: Gestionar carrito de compras ---------- */

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;

  const safeQuantity = Math.max(0, Math.floor(Number(quantity)) || 0);

  if (safeQuantity <= 0) {
    setCart(cart.filter((entry) => entry.id !== productId));
  } else {
    item.cantidad = safeQuantity;
    setCart(cart);
  }

  updateCartCount();
  renderCart();
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  setCart(cart);
  updateCartCount();
  renderCart();
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
        <label class="quantity-control">
          <span>Cantidad</span>
          <input type="number" min="1" max="20" value="1" data-quantity-for="${product.id}" aria-label="Cantidad de ${product.nombre}">
        </label>
        <button class="btn primary" type="button" data-add-cart="${product.id}">Agregar al carrito</button>
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
      <p class="eyebrow">HU2 - Detalle del producto</p>
      <h1>${product.nombre}</h1>
      <p>${product.descripcion}</p>
      <p class="ingredients">Ingredientes: ${product.ingredientes}</p>
      <strong class="price">${money.format(product.precio)}</strong>
      <label class="quantity-control detail-quantity">
        <span>Cantidad</span>
        <input type="number" min="1" max="20" value="1" data-quantity-for="${product.id}" aria-label="Cantidad de ${product.nombre}">
      </label>
      <div class="detail-actions">
        <a class="btn secondary" href="menu.html">Volver al menu</a>
        <button class="btn primary" type="button" data-add-cart="${product.id}">Agregar al carrito</button>
      </div>
    </div>
  `;
}

/* ---------- Carrito (pagina) ---------- */

function renderCart() {
  const list = document.querySelector("#carrito-lista");
  const total = document.querySelector("#carrito-total");
  if (!list || !total) return;

  const cart = getCart();
  if (cart.length === 0) {
    list.innerHTML = `<p class="empty-state">El carrito esta vacio. Agrega un producto desde el menu.</p>`;
    total.textContent = money.format(0);
    return;
  }

  let cartTotal = 0;
  list.innerHTML = cart.map((item) => {
    const product = menu.find((menuItem) => menuItem.id === item.id);
    if (!product) return "";
    const subtotal = product.precio * item.cantidad;
    cartTotal += subtotal;
    return `
      <article class="cart-item">
        <img src="${product.img}" alt="${product.nombre}">
        <div class="cart-item-info">
          <h3>${product.nombre}</h3>
          <label class="quantity-control cart-quantity">
            <span>Cantidad</span>
            <input type="number" min="1" max="20" value="${item.cantidad}" data-cart-quantity-for="${product.id}" aria-label="Cantidad de ${product.nombre} en el carrito">
          </label>
          <strong class="price">${money.format(subtotal)}</strong>
        </div>
        <button class="btn secondary" type="button" data-remove-cart="${product.id}">Quitar</button>
      </article>
    `;
  }).join("");

  total.textContent = money.format(cartTotal);
}

/* ---------- HU6: Realizar pedido (checkout) ---------- */

function openCheckoutModal() {
  const modal = document.querySelector("#checkoutModal");
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function setupCheckout() {
  const checkoutForm = document.querySelector("#checkoutForm");
  if (!checkoutForm) return;

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const cart = getCart();
    const cartMessage = document.querySelector("#carritoMensaje");

    if (cart.length === 0) {
      closeModals();
      return;
    }

    const formData = new FormData(checkoutForm);
    const nombre = formData.get("nombre").toString().trim();
    const telefono = formData.get("telefono").toString().trim();
    const direccion = formData.get("direccion").toString().trim();

    const items = cart.map((item) => {
      const product = menu.find((menuItem) => menuItem.id === item.id);
      return {
        id: item.id,
        nombre: product ? product.nombre : "Producto",
        cantidad: item.cantidad,
        precio: product ? product.precio : 0
      };
    });

    const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    const orders = getOrders();
    const codigo = generateOrderCode(orders.map((order) => order.codigo));

    const order = {
      codigo,
      fecha: new Date().toISOString(),
      cliente: { nombre, telefono, direccion },
      items,
      total,
      estado: "Pendiente"
    };

    orders.unshift(order);
    setOrders(orders);
    updateOrdersCount();

    setCart([]);
    updateCartCount();
    renderCart();

    checkoutForm.reset();
    closeModals();

    if (cartMessage) {
      cartMessage.textContent = `Pedido confirmado. Tu codigo de seguimiento es ${codigo}. Puedes verlo en "Pedidos Pendientes".`;
    }
  });
}

/* ---------- Pagina de pedidos pendientes ---------- */

function renderOrders() {
  const container = document.querySelector("#pedidos-lista");
  if (!container) return;

  const orders = getOrders();

  if (orders.length === 0) {
    container.innerHTML = `<p class="empty-state">Aun no tienes pedidos pendientes. Finaliza una compra desde el carrito para generar un codigo.</p>`;
    return;
  }

  container.innerHTML = orders.map((order) => {
    const itemsList = order.items
      .map((item) => `<li>${item.cantidad} x ${item.nombre} - ${money.format(item.precio * item.cantidad)}</li>`)
      .join("");

    const fecha = new Date(order.fecha).toLocaleString("es-CR", {
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

document.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-product]");
  const addButton = event.target.closest("[data-add-cart]");
  const removeButton = event.target.closest("[data-remove-cart]");
  const closeButton = event.target.closest("[data-close-modal]");
  const finalizeButton = event.target.closest("#btnFinalizarPedido");

  if (openButton) {
    openProductModal(Number(openButton.dataset.openProduct));
  }

  if (addButton) {
    const quantity = getSelectedQuantity(addButton);
    addToCart(Number(addButton.dataset.addCart), quantity);
    addButton.textContent = "Agregado";
    setTimeout(() => {
      addButton.textContent = "Agregar al carrito";
    }, 900);
  }

  if (removeButton) {
    removeFromCart(Number(removeButton.dataset.removeCart));
  }

  if (finalizeButton) {
    const cart = getCart();
    const cartMessage = document.querySelector("#carritoMensaje");

    if (cart.length === 0) {
      if (cartMessage) {
        cartMessage.textContent = "Agrega al menos un producto antes de finalizar el pedido.";
      }
      return;
    }

    if (cartMessage) {
      cartMessage.textContent = "";
    }
    openCheckoutModal();
  }

  if (closeButton || event.target.classList.contains("modal")) {
    closeModals();
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
  }
});

/* ---------- Inicializacion ---------- */

setupNavigation();
setupReservation();
setupMenuSearch();
setupCheckout();
renderProducts("#contenedor-menu", menu);
renderProducts("#favoritos-lista", menu.filter((product) => product.favorito));
renderDetailPage();
renderCart();
renderOrders();
updateCartCount();
updateOrdersCount();