(function () {
  const state = {
    menu: null,
    cart: {} // id -> { item, qty }
  };

  const DELIVERY_FEE = 3.5;

  const el = (id) => document.getElementById(id);

  const money = (n) => `$${n.toFixed(2)}`;

  // ---- Load menu ----
  async function loadMenu() {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      state.menu = data;
      renderMenu(data);
      renderTicker(data);
      el('etaPill').textContent = data.restaurant.eta;
    } catch (err) {
      el('menuRoot').innerHTML = '<p class="loading">Could not load the menu. Is the server running?</p>';
    }
  }

  function renderTicker(data) {
    const names = data.categories.flatMap(c => c.items.map(i => `${i.icon} ${i.name}`));
    const doubled = [...names, ...names];
    el('tickerTrack').innerHTML = doubled.map(n => `<span>${n}</span>`).join('');
  }

  function renderMenu(data) {
    const root = el('menuRoot');
    root.innerHTML = '';
    data.categories.forEach(cat => {
      const block = document.createElement('div');
      block.className = 'category-block';
      block.innerHTML = `
        <h2 class="category-heading">${cat.name}</h2>
        <p class="category-count">${cat.items.length} item${cat.items.length > 1 ? 's' : ''}</p>
      `;
      cat.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
          <div class="item-icon">${item.icon}</div>
          <div class="item-main">
            <div class="item-name-row">
              <span class="item-name">${item.name}</span>
              ${item.tag ? `<span class="item-tag ${item.tag}">${item.tag}</span>` : ''}
            </div>
            <p class="item-desc">${item.desc}</p>
          </div>
          <div class="item-side">
            <span class="item-price">${money(item.price)}</span>
            <button class="add-btn" data-id="${item.id}" aria-label="Add ${item.name}">+</button>
          </div>
        `;
        block.appendChild(row);
      });
      root.appendChild(block);
    });

    root.querySelectorAll('.add-btn').forEach(btn => {
      btn.addEventListener('click', () => addToCart(btn.dataset.id));
    });
  }

  function findItem(id) {
    for (const cat of state.menu.categories) {
      const found = cat.items.find(i => i.id === id);
      if (found) return found;
    }
    return null;
  }

  // ---- Cart logic ----
  function addToCart(id) {
    const item = findItem(id);
    if (!item) return;
    if (state.cart[id]) {
      state.cart[id].qty += 1;
    } else {
      state.cart[id] = { item, qty: 1 };
    }
    renderCart();
    pulseCartButton();
  }

  function changeQty(id, delta) {
    const line = state.cart[id];
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) delete state.cart[id];
    renderCart();
  }

  function cartLines() {
    return Object.values(state.cart);
  }

  function subtotal() {
    return cartLines().reduce((sum, l) => sum + l.item.price * l.qty, 0);
  }

  function renderCart() {
    const lines = cartLines();
    const countEl = el('cartCount');
    const itemsEl = el('cartItems');
    const sub = subtotal();
    const total = lines.length ? sub + DELIVERY_FEE : 0;

    countEl.textContent = lines.reduce((n, l) => n + l.qty, 0);

    if (!lines.length) {
      itemsEl.innerHTML = '<p class="empty-cart">Your cart is empty. Add something from the grill.</p>';
    } else {
      itemsEl.innerHTML = lines.map(l => `
        <div class="cart-line">
          <div class="cart-line-icon">${l.item.icon}</div>
          <div class="cart-line-info">
            <div class="cart-line-name">${l.item.name}</div>
            <div class="cart-line-price">${money(l.item.price)} each</div>
          </div>
          <div class="qty-control">
            <button data-id="${l.item.id}" data-delta="-1" aria-label="Remove one">–</button>
            <span>${l.qty}</span>
            <button data-id="${l.item.id}" data-delta="1" aria-label="Add one">+</button>
          </div>
        </div>
      `).join('');

      itemsEl.querySelectorAll('.qty-control button').forEach(btn => {
        btn.addEventListener('click', () => changeQty(btn.dataset.id, Number(btn.dataset.delta)));
      });
    }

    el('cartSubtotal').textContent = money(sub);
    el('cartDelivery').textContent = lines.length ? money(DELIVERY_FEE) : money(0);
    el('cartTotal').textContent = money(total);
    const modalTotalEl = el('modalTotal');
    if (modalTotalEl) modalTotalEl.textContent = money(total);
    el('checkoutBtn').disabled = lines.length === 0;
  }

  function pulseCartButton() {
    const btn = el('cartBtn');
    btn.style.transform = 'scale(1.06)';
    setTimeout(() => { btn.style.transform = 'scale(1)'; }, 120);
  }

  // ---- Drawer / modal controls ----
  function openDrawer() {
    el('cartDrawer').classList.add('open');
    el('drawerOverlay').classList.add('open');
  }
  function closeDrawer() {
    el('cartDrawer').classList.remove('open');
    el('drawerOverlay').classList.remove('open');
  }

  function openModal(overlayId) { el(overlayId).classList.add('open'); }
  function closeModal(overlayId) { el(overlayId).classList.remove('open'); }

  // ---- Checkout ----
  async function placeOrder(e) {
    e.preventDefault();
    const customer = {
      name: el('custName').value.trim(),
      address: el('custAddress').value.trim(),
      phone: el('custPhone').value.trim()
    };

    const items = cartLines().map(l => ({
      id: l.item.id, name: l.item.name, price: l.item.price, qty: l.qty
    }));
    const total = subtotal() + DELIVERY_FEE;

    const placeBtn = el('placeOrderBtn');
    placeBtn.disabled = true;
    el('placeOrderLabel').textContent = 'Placing order…';
    el('modalTotal').style.display = 'none';

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customer, total })
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || 'Something went wrong');

      // Reset cart + UI
      state.cart = {};
      renderCart();
      closeModal('checkoutOverlay');
      closeDrawer();
      el('confirmDetail').innerHTML = `
        Order <strong>${order.orderId}</strong><br>
        Arriving in about <strong>${order.etaMinutes} minutes</strong><br>
        Delivering to ${order.customer.address}
      `;
      openModal('confirmOverlay');
      el('checkoutForm').reset();
    } catch (err) {
      alert(err.message);
    } finally {
      placeBtn.disabled = false;
      el('placeOrderLabel').textContent = 'Place order —';
      el('modalTotal').style.display = '';
    }
  }

  // ---- Wire up events ----
  function init() {
    el('cartBtn').addEventListener('click', openDrawer);
    el('closeCartBtn').addEventListener('click', closeDrawer);
    el('drawerOverlay').addEventListener('click', closeDrawer);

    el('checkoutBtn').addEventListener('click', () => {
      closeDrawer();
      openModal('checkoutOverlay');
    });
    el('closeCheckoutBtn').addEventListener('click', () => closeModal('checkoutOverlay'));
    el('checkoutOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'checkoutOverlay') closeModal('checkoutOverlay');
    });
    el('checkoutForm').addEventListener('submit', placeOrder);

    el('confirmCloseBtn').addEventListener('click', () => closeModal('confirmOverlay'));

    loadMenu();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
