/* ========================================
   1. PRODUCT DATA
======================================== */

let products = [];


/* ========================================
   2. DOM ELEMENTS
======================================== */

const productGrid = document.getElementById("productGrid");
const productTotal = document.getElementById("productTotal");

const searchInput = document.getElementById("searchInput");
const clearSearchButton = document.getElementById("clearSearch");
const sortSelect = document.getElementById("sortSelect");

const allProductsButton =
    document.getElementById("allProductsButton");

const wishlistFilterButton =
    document.getElementById("wishlistFilterButton");

const wishlistToggle = document.getElementById("wishlistToggle");
const wishlistCount = document.getElementById("wishlistCount");

const cartToggle = document.getElementById("cartToggle");
const cartCount = document.getElementById("cartCount");
const cartTitleCount = document.getElementById("cartTitleCount");
const cartDrawer = document.getElementById("cartDrawer");
const cartBackdrop = document.getElementById("cartBackdrop");
const cartClose = document.getElementById("cartClose");
const cartItemsContainer = document.getElementById("cartItems");
const cartSubtotal = document.getElementById("cartSubtotal");
const checkoutButton = document.getElementById("checkoutButton");

const emptyState = document.getElementById("emptyState");
const resetProductsButton = document.getElementById("resetProducts");

const productModal = document.getElementById("productModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

const newsletterForm = document.getElementById("newsletterForm");
const emailInput = document.getElementById("emailInput");

const toast = document.getElementById("toast");


/* ========================================
   3. BROWSER STORAGE
======================================== */

function loadStoredData(key, fallback) {
    try {
        const storedValue = localStorage.getItem(key);

        if (storedValue === null) {
            return fallback;
        }

        return JSON.parse(storedValue);

    } catch (error) {
        console.warn("Could not load browser storage:", error);
        return fallback;
    }
}


function saveStoredData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));

    } catch (error) {
        console.warn("Could not save browser storage:", error);
        showToast("Your browser could not save this change.");
    }
}


function normalizeProductIds(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return [
        ...new Set(
            value.filter(
                id =>
                    Number.isInteger(id) &&
                    products.some(product => product.id === id)
            )
        )
    ];
}


function normalizeCart(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    const normalizedItems = [];

    value.forEach(item => {
        if (
            !item ||
            !Number.isInteger(item.id) ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            !products.some(product => product.id === item.id)
        ) {
            return;
        }

        const existingItem = normalizedItems.find(
            cartItem => cartItem.id === item.id
        );

        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            normalizedItems.push({
                id: item.id,
                quantity: item.quantity
            });
        }
    });

    return normalizedItems;
}


// These are initialized after products are loaded from the Flask API.
let wishlist = [];
let cart = [];


/* ========================================
   4. APPLICATION STATE
======================================== */

let wishlistOnly = false;
let toastTimer;

let lastFocusedElement = null;


/* ========================================
   5. HELPER FUNCTIONS
======================================== */

function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(price);
}


function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}


function showToast(message) {
    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}


function getProductById(id) {
    return products.find(product => product.id === id);
}


function getCartQuantity() {
    return cart.reduce(
        (total, item) => total + item.quantity,
        0
    );
}


function getCartSubtotal() {
    return cart.reduce((total, item) => {
        const product = getProductById(item.id);

        return total + product.price * item.quantity;
    }, 0);
}


function persistWishlist() {
    saveStoredData("infinityWishlist", wishlist);
}


function persistCart() {
    saveStoredData("infinityCart", cart);
}


/* ========================================
   6. PRODUCT RENDERING
======================================== */

function renderProducts() {
    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    let filteredProducts = products.filter(product => {
        const searchableText = [
            product.name,
            product.category,
            product.description
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);

        const matchesWishlist =
            !wishlistOnly || wishlist.includes(product.id);

        return matchesSearch && matchesWishlist;
    });


    /* Sorting */

    switch (sortSelect.value) {
        case "price-low":
            filteredProducts.sort(
                (a, b) => a.price - b.price
            );
            break;

        case "price-high":
            filteredProducts.sort(
                (a, b) => b.price - a.price
            );
            break;

        case "name":
            filteredProducts.sort(
                (a, b) => a.name.localeCompare(b.name)
            );
            break;

        default:
            filteredProducts.sort(
                (a, b) => a.id - b.id
            );
    }


    /* Update product count */

    productTotal.textContent =
        `${filteredProducts.length} ${
            filteredProducts.length === 1 ? "product" : "products"
        }`;


    /* Update search controls */

    clearSearchButton.hidden = searchInput.value.length === 0;

    wishlistFilterButton.classList.toggle(
        "selected",
        wishlistOnly
    );

    allProductsButton.classList.toggle(
        "selected",
        !wishlistOnly
    );


    /* Empty state */

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = "";
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;


    /* Create product cards */

    productGrid.innerHTML = filteredProducts.map(product => {
        const isFavorite = wishlist.includes(product.id);

        return `
            <article class="product-card">

                <div class="product-image-wrap">

                    <img
                        class="product-image"
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                        loading="lazy"
                    >

                    <span class="product-tag">
                        ${escapeHTML(product.tag)}
                    </span>

                    <button
                        type="button"
                        class="product-wishlist ${
                            isFavorite ? "is-favorite" : ""
                        }"
                        data-action="wishlist"
                        data-id="${product.id}"
                        aria-label="${
                            isFavorite
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                        }: ${escapeHTML(product.name)}"
                        aria-pressed="${isFavorite}"
                    >
                        <i class="${
                            isFavorite
                                ? "fa-solid"
                                : "fa-regular"
                        } fa-heart"></i>
                    </button>

                </div>


                <div class="product-info">

                    <p class="product-category">
                        ${escapeHTML(product.category)}
                    </p>

                    <h3>${escapeHTML(product.name)}</h3>

                    <p class="product-description">
                        ${escapeHTML(product.description)}
                    </p>

                    <div class="product-bottom">

                        <span class="product-price">
                            ${formatPrice(product.price)}
                        </span>

                        <div class="product-actions">

                            <button
                                type="button"
                                class="details-button"
                                data-action="details"
                                data-id="${product.id}"
                            >
                                Details
                            </button>

                            <button
                                type="button"
                                class="add-cart-button"
                                data-action="add-cart"
                                data-id="${product.id}"
                                aria-label="Add ${escapeHTML(product.name)} to cart"
                            >
                                <i class="fa-solid fa-plus"></i>
                            </button>

                        </div>

                    </div>

                </div>

            </article>
        `;
    }).join("");
}


/* ========================================
   7. WISHLIST
======================================== */

function toggleWishlist(productId) {
    const product = getProductById(productId);

    if (!product) {
        return;
    }

    const alreadyFavorite = wishlist.includes(productId);

    if (alreadyFavorite) {
        wishlist = wishlist.filter(id => id !== productId);

        showToast(`${product.name} removed from wishlist.`);

    } else {
        wishlist.push(productId);

        showToast(`${product.name} added to wishlist.`);
    }

    persistWishlist();
    updateHeaderCounts();
    renderProducts();
}


function updateHeaderCounts() {
    cartCount.textContent = getCartQuantity();
    wishlistCount.textContent = wishlist.length;

    cartTitleCount.textContent = `(${getCartQuantity()})`;
}


/* ========================================
   8. SHOPPING CART
======================================== */

function addToCart(productId) {
    const product = getProductById(productId);

    if (!product) {
        return;
    }

    const existingItem = cart.find(
        item => item.id === productId
    );

    if (existingItem) {
        existingItem.quantity += 1;

    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }

    persistCart();
    updateHeaderCounts();
    renderCart();

    showToast(`${product.name} added to your cart.`);
}


function changeCartQuantity(productId, change) {
    const item = cart.find(
        cartItem => cartItem.id === productId
    );

    if (!item) {
        return;
    }

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(
            cartItem => cartItem.id !== productId
        );
    }

    persistCart();
    updateHeaderCounts();
    renderCart();
}


function removeFromCart(productId) {
    const product = getProductById(productId);

    cart = cart.filter(
        item => item.id !== productId
    );

    persistCart();
    updateHeaderCounts();
    renderCart();

    if (product) {
        showToast(`${product.name} removed from your cart.`);
    }
}


function renderCart() {
    updateHeaderCounts();

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-bag-shopping"></i>

                <h3>Your cart is empty</h3>

                <p>Discover something you love and add it here.</p>
            </div>
        `;

    } else {
        cartItemsContainer.innerHTML = cart.map(item => {
            const product = getProductById(item.id);

            return `
                <div class="cart-item">

                    <img
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                    >

                    <div>

                        <h3>${escapeHTML(product.name)}</h3>

                        <div class="cart-item-price">
                            ${formatPrice(product.price * item.quantity)}
                        </div>

                        <div class="quantity-controls">

                            <button
                                type="button"
                                data-cart-action="decrease"
                                data-id="${product.id}"
                                aria-label="Decrease quantity"
                            >
                                <i class="fa-solid fa-minus"></i>
                            </button>

                            <span>${item.quantity}</span>

                            <button
                                type="button"
                                data-cart-action="increase"
                                data-id="${product.id}"
                                aria-label="Increase quantity"
                            >
                                <i class="fa-solid fa-plus"></i>
                            </button>

                        </div>

                    </div>

                    <button
                        type="button"
                        class="remove-cart-item"
                        data-cart-action="remove"
                        data-id="${product.id}"
                        aria-label="Remove ${escapeHTML(product.name)}"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>
            `;
        }).join("");
    }

    cartSubtotal.textContent = formatPrice(getCartSubtotal());
}


/* ========================================
   9. CART DRAWER OPEN AND CLOSE
======================================== */

function openCart() {
    lastFocusedElement = document.activeElement;

    cartDrawer.classList.add("is-open");
    cartDrawer.setAttribute("aria-hidden", "false");
    cartDrawer.inert = false;

    cartBackdrop.hidden = false;
    document.body.classList.add("no-scroll");

    cartClose.focus();
}


function closeCart() {
    cartDrawer.classList.remove("is-open");
    cartDrawer.setAttribute("aria-hidden", "true");
    cartDrawer.inert = true;

    cartBackdrop.hidden = true;
    document.body.classList.remove("no-scroll");

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}


/* ========================================
   10. PRODUCT DETAILS MODAL
======================================== */

function openProductDetails(productId) {
    const product = getProductById(productId);

    if (!product) {
        return;
    }

    lastFocusedElement = document.activeElement;

    modalContent.innerHTML = `
        <img
            class="modal-image"
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.name)}"
        >

        <div class="modal-product-info">

            <span class="section-kicker">
                ${escapeHTML(product.category)}
            </span>

            <h2 id="modalTitle">
                ${escapeHTML(product.name)}
            </h2>

            <p class="modal-description">
                ${escapeHTML(product.description)}
            </p>

            <div class="modal-price">
                ${formatPrice(product.price)}
            </div>

            <button
                type="button"
                class="primary-button"
                data-action="modal-add-cart"
                data-id="${product.id}"
            >
                <i class="fa-solid fa-bag-shopping"></i>
                Add to Cart
            </button>

        </div>
    `;

    productModal.hidden = false;
    document.body.classList.add("no-scroll");

    modalClose.focus();
}


function closeProductDetails() {
    productModal.hidden = true;
    document.body.classList.remove("no-scroll");

    modalContent.innerHTML = "";

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}


/* ========================================
   11. PRODUCT EVENT HANDLING
======================================== */

productGrid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const productId = Number(button.dataset.id);

    switch (button.dataset.action) {
        case "wishlist":
            toggleWishlist(productId);
            break;

        case "details":
            openProductDetails(productId);
            break;

        case "add-cart":
            addToCart(productId);
            break;
    }
});


modalContent.addEventListener("click", event => {
    const button = event.target.closest(
        'button[data-action="modal-add-cart"]'
    );

    if (!button) {
        return;
    }

    const productId = Number(button.dataset.id);

    closeProductDetails();
    addToCart(productId);
});


cartItemsContainer.addEventListener("click", event => {
    const button = event.target.closest("button[data-cart-action]");

    if (!button) {
        return;
    }

    const productId = Number(button.dataset.id);

    switch (button.dataset.cartAction) {
        case "increase":
            changeCartQuantity(productId, 1);
            break;

        case "decrease":
            changeCartQuantity(productId, -1);
            break;

        case "remove":
            removeFromCart(productId);
            break;
    }
});


/* ========================================
   12. SEARCH, SORTING, AND FILTERING
======================================== */

searchInput.addEventListener("input", renderProducts);


clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";

    renderProducts();
    searchInput.focus();
});


sortSelect.addEventListener("change", renderProducts);


allProductsButton.addEventListener("click", () => {
    wishlistOnly = false;

    renderProducts();
});


wishlistFilterButton.addEventListener("click", () => {
    wishlistOnly = !wishlistOnly;

    renderProducts();
});


wishlistToggle.addEventListener("click", () => {
    wishlistOnly = true;

    renderProducts();

    document.getElementById("products").scrollIntoView({
        behavior: "smooth"
    });
});


resetProductsButton.addEventListener("click", () => {
    searchInput.value = "";
    wishlistOnly = false;
    sortSelect.value = "featured";

    renderProducts();
});


/* ========================================
   13. CART EVENT HANDLERS
======================================== */

cartToggle.addEventListener("click", openCart);

cartClose.addEventListener("click", closeCart);

cartBackdrop.addEventListener("click", closeCart);


checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Your cart is empty.");
        return;
    }

    showToast("Checkout is a demo. No payment was processed.");
});


/* ========================================
   14. PRODUCT MODAL EVENTS
======================================== */

modalClose.addEventListener("click", closeProductDetails);


productModal.addEventListener("click", event => {
    if (event.target === productModal) {
        closeProductDetails();
    }
});


/* ========================================
   15. MOBILE NAVIGATION
======================================== */

menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));

    menuToggle.innerHTML = isOpen
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';
});


mainNav.addEventListener("click", event => {
    if (event.target.closest("a")) {
        mainNav.classList.remove("is-open");

        menuToggle.setAttribute("aria-expanded", "false");

        menuToggle.innerHTML =
            '<i class="fa-solid fa-bars"></i>';
    }
});


/* ========================================
   16. KEYBOARD SUPPORT
======================================== */

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") {
        return;
    }

    if (!productModal.hidden) {
        closeProductDetails();

    } else if (cartDrawer.classList.contains("is-open")) {
        closeCart();

    } else if (mainNav.classList.contains("is-open")) {
        mainNav.classList.remove("is-open");

        menuToggle.setAttribute("aria-expanded", "false");

        menuToggle.innerHTML =
            '<i class="fa-solid fa-bars"></i>';

        menuToggle.focus();
    }
});


/* ========================================
   17. NEWSLETTER DEMO
======================================== */

newsletterForm.addEventListener("submit", event => {
    event.preventDefault();

    const email = emailInput.value.trim();

    if (!emailInput.checkValidity() || !email) {
        emailInput.reportValidity();
        return;
    }

    showToast("Thanks for your interest in Infinity!");

    newsletterForm.reset();
});


/* ========================================
   18. INITIALIZE THE WEBSITE
======================================== */

function initializeWebsite() {
    // Load saved wishlist/cart only after the API products are available.
    wishlist = normalizeProductIds(
        loadStoredData("infinityWishlist", [])
    );

    cart = normalizeCart(
        loadStoredData("infinityCart", [])
    );

    renderProducts();
    renderCart();
    updateHeaderCounts();
}


// Load products from the Flask + SQLite backend.
async function loadProducts() {
    try {
        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error(`Product API returned ${response.status}`);
        }

        const data = await response.json();

        products = data.map(product => ({
            ...product,
            id: Number(product.id),
            price: Number(product.price),
            image: product.image
                ? (product.image.startsWith("http")
                    ? product.image
                    : `/static/images/${product.image}`)
                : "https://placehold.co/600x500?text=No+Image",
            tag: product.tag || "Featured"
        }));

        initializeWebsite();

    } catch (error) {
        console.error("Could not load products:", error);
        productGrid.innerHTML = "";
        emptyState.hidden = false;
        emptyState.querySelector("h3").textContent = "Products could not be loaded";
        emptyState.querySelector("p").textContent =
            "Please check that the Flask server and database are running.";
    }
}

loadProducts();