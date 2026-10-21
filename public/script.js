
const productsContainer = document.getElementById("products");
const cartCount = document.getElementById("cartCount");

const hero = document.getElementById("hero");
const shopSection = document.getElementById("shopSection");
const detailsSection = document.getElementById("details");
const cartSection = document.getElementById("cart");
const checkoutSection = document.getElementById("checkout");
const confirmationSection = document.getElementById("confirmation");

const API_BASE =
    window.location.port === "3000" || window.location.port === ""
        ? ""
        : "http://localhost:3000";

const fallbackProducts = [
    {
        id: 1,
        name: "Wireless Headphones",
        price: 1499,
        description: "Comfortable wireless headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"
    },
    {
        id: 2,
        name: "Smart Watch",
        price: 2499,
        description: "Modern smartwatch for everyday use",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    },
    {
        id: 3,
        name: "Backpack",
        price: 999,
        description: "Stylish everyday backpack",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"
    },
    {
        id: 4,
        name: "Running Shoes",
        price: 1999,
        description: "Comfortable sports shoes",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    },
    {
        id: 5,
        name: "Coffee Mug",
        price: 299,
        description: "Simple ceramic coffee mug",
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600"
    },
    {
        id: 6,
        name: "Desk Lamp",
        price: 799,
        description: "Modern lamp for your desk",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600"
    }
];

let products = [];
let cart = [];

try {
    const saved = JSON.parse(localStorage.getItem("shopease-cart"));
    cart = Array.isArray(saved) ? saved : [];
} catch {
    cart = [];
}

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getId(product) {
    return product.id ?? product.productId ?? product.product_id;
}

function getName(product) {
    return product.name ?? product.title ?? product.productName ?? "Product";
}

function getImage(product) {
    return product.image ??
        product.imageUrl ??
        product.image_url ??
        product.img ??
        product.thumbnail ??
        "";
}

function saveCart() {
    localStorage.setItem("shopease-cart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    cartCount.textContent = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    );
}

async function loadProducts() {
    productsContainer.innerHTML = "<p>Loading products...</p>";

    try {
        const response = await fetch(`${API_BASE}/api/products`);

        if (!response.ok) throw new Error("Products API failed");

        const data = await response.json();
        const serverProducts = Array.isArray(data)
            ? data
            : data.products ?? data.data ?? [];

        products = serverProducts.length
            ? serverProducts.map((product, index) => {
                const fallback = fallbackProducts[index % fallbackProducts.length];

                return {
                    ...product,
                    id: getId(product) ?? fallback.id,
                    name: getName(product) || fallback.name,
                    price: product.price ?? fallback.price,
                    description: product.description ?? fallback.description,
                    image: getImage(product) || fallback.image
                };
            })
            : fallbackProducts;
    } catch (error) {
        console.error("Products API error:", error);
        // Show demo products even when the backend is unavailable.
        products = fallbackProducts;
    }

    displayProducts(products);
}

function displayProducts(list) {
    if (!list.length) {
        productsContainer.innerHTML = "<p>No products available.</p>";
        return;
    }

    productsContainer.innerHTML = list.map(product => `
        <article class="product-card">
            <img
                class="product-image"
                src="${escapeHTML(getImage(product))}"
                alt="${escapeHTML(getName(product))}"
                loading="lazy"
                onerror="this.onerror=null;this.src='https://placehold.co/400x300?text=Product'"
            >
            <h3>${escapeHTML(getName(product))}</h3>
            <p>${escapeHTML(product.description || "")}</p>
            <p><strong>${money(product.price)}</strong></p>
            <button data-add="${escapeHTML(getId(product))}">Add to Cart</button>
            <button data-details="${escapeHTML(getId(product))}">View Details</button>
        </article>
    `).join("");
}

function showSection(section) {
    [hero, shopSection, detailsSection, cartSection,
     checkoutSection, confirmationSection].forEach(element => {
        element.classList.add("hidden");
    });

    section.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHome() {
    hero.classList.remove("hidden");
    shopSection.classList.remove("hidden");
    detailsSection.classList.add("hidden");
    cartSection.classList.add("hidden");
    checkoutSection.classList.add("hidden");
    confirmationSection.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function addToCart(id) {
    const product = products.find(p => String(getId(p)) === String(id));
    if (!product) return alert("Product not found.");

    const existing = cart.find(item => String(item.productId) === String(id));

    if (existing) existing.quantity++;
    else cart.push({ productId: id, quantity: 1 });

    saveCart();
    alert("Product added to cart!");
}

function showProductDetails(id) {
    const product = products.find(p => String(getId(p)) === String(id));
    if (!product) return;

    detailsSection.innerHTML = `
        <h2>${escapeHTML(getName(product))}</h2>
        <img class="product-image"
             src="${escapeHTML(getImage(product))}"
             alt="${escapeHTML(getName(product))}"
             onerror="this.onerror=null;this.src='https://placehold.co/400x300?text=Product'">
        <p>${escapeHTML(product.description || "")}</p>
        <h3>${money(product.price)}</h3>
        <button data-add="${escapeHTML(getId(product))}">Add to Cart</button>
        <button id="backToShop">Back to Shop</button>
    `;

    showSection(detailsSection);
}

function getCartItems() {
    return cart.map(item => {
        const product = products.find(
            p => String(getId(p)) === String(item.productId)
        );
        return product ? { ...product, quantity: item.quantity } : null;
    }).filter(Boolean);
}

function getTotal() {
    return getCartItems().reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
    );
}

function showCart() {
    const items = getCartItems();

    cartSection.innerHTML = `
        <h2>Your Cart</h2>
        ${items.length ? items.map(item => `
            <div class="cart-item">
                <h3>${escapeHTML(getName(item))}</h3>
                <p>${money(item.price)} × ${item.quantity}</p>
                <button data-decrease="${escapeHTML(getId(item))}">−</button>
                <button data-increase="${escapeHTML(getId(item))}">+</button>
                <button data-remove="${escapeHTML(getId(item))}">Remove</button>
            </div>
        `).join("") : "<p>Your cart is empty.</p>"}
        <h3>Total: ${money(getTotal())}</h3>
        <button id="checkoutBtn">Proceed to Checkout</button>
        <button id="backToShop">Continue Shopping</button>
    `;

    showSection(cartSection);
}

function showCheckout() {
    if (!getCartItems().length) {
        alert("Your cart is empty.");
        return showCart();
    }

    checkoutSection.innerHTML = `
        <h2>Checkout</h2>
        <p>Total: ${money(getTotal())}</p>
        <form id="checkoutForm">
            <input name="name" placeholder="Full Name" required>
            <input name="email" type="email" placeholder="Email" required>
            <textarea name="address" placeholder="Delivery Address" required></textarea>
            <button type="submit">Place Order</button>
            <button type="button" id="backToCart">Back to Cart</button>
        </form>
    `;

    showSection(checkoutSection);
}

async function placeOrder(event) {
    event.preventDefault();

    const form = event.target;
    const button = form.querySelector('[type="submit"]');

    const customer = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        address: form.elements.address.value.trim()
    };

    button.disabled = true;
    button.textContent = "Placing Order...";

    try {
        const response = await fetch(`${API_BASE}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...customer,
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Order failed.");

        const total = getTotal();
        cart = [];
        saveCart();

        confirmationSection.innerHTML = `
            <div class="success">
                <h2>✓ Order Placed Successfully!</h2>
                <p>Thank you, ${escapeHTML(customer.name)}.</p>
                <p>Order ID: <strong>${escapeHTML(result.orderId ?? result.id ?? "Confirmed")}</strong></p>
                <p>Total: <strong>${money(result.total ?? total)}</strong></p>
                <p>This is a demo order. No real payment was collected.</p>
                <button type="button" id="continueShoppingBtn">Continue Shopping</button>
            </div>
        `;

        showSection(confirmationSection);
    } catch (error) {
        console.error(error);
        alert(error.message || "Could not place order.");
        button.disabled = false;
        button.textContent = "Place Order";
    }
}

document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const add = event.target.closest("[data-add]");
    if (add) return addToCart(add.dataset.add);

    const details = event.target.closest("[data-details]");
    if (details) return showProductDetails(details.dataset.details);

    const increase = event.target.closest("[data-increase]");
    if (increase) {
        const item = cart.find(p => String(p.productId) === increase.dataset.increase);
        if (item) item.quantity++;
        saveCart();
        return showCart();
    }

    const decrease = event.target.closest("[data-decrease]");
    if (decrease) {
        const item = cart.find(p => String(p.productId) === decrease.dataset.decrease);
        if (item) item.quantity--;
        cart = cart.filter(p => p.quantity > 0);
        saveCart();
        return showCart();
    }

    const remove = event.target.closest("[data-remove]");
    if (remove) {
        cart = cart.filter(p => String(p.productId) !== remove.dataset.remove);
        saveCart();
        return showCart();
    }

    if (event.target.closest("#continueShoppingBtn")) return showHome();
    if (event.target.closest("#homeBtn")) return showHome();
    if (event.target.closest("#shopBtn")) return showHome();
    if (event.target.closest("#backToShop")) return showHome();
    if (event.target.closest("#cartBtn")) return showCart();
    if (event.target.closest("#checkoutBtn")) return showCheckout();
    if (event.target.closest("#backToCart")) return showCart();
    if (event.target.closest("#retryProductsBtn")) return loadProducts();
});

document.addEventListener("submit", event => {
    if (event.target.id === "checkoutForm") placeOrder(event);
});

const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        displayProducts(products.filter(product =>
            getName(product).toLowerCase().includes(query) ||
            String(product.description || "").toLowerCase().includes(query)
        ));
    });
}

updateCartCount();
loadProducts();
