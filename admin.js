// --- ADMIN PORTAL CONTROLLER LOGIC ---

const PORTAL_PASSCODE = "mehranadmin99";

// Handle authentication check on load
document.addEventListener("DOMContentLoaded", () => {
    const lockScreen = document.getElementById('lock-screen');
    const lockForm = document.getElementById('lock-form');
    const passcodeInput = document.getElementById('passcode-input');
    const lockError = document.getElementById('lock-error');
    
    // Check session login state
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        if (lockScreen) lockScreen.style.display = 'none';
        document.body.style.opacity = '1';
        initializeDashboard();
    } else {
        document.body.style.opacity = '1'; // Show lock screen
        if (lockForm) {
            lockForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (passcodeInput.value === PORTAL_PASSCODE) {
                    sessionStorage.setItem('isAdminAuthenticated', 'true');
                    lockScreen.classList.add('hidden');
                    setTimeout(() => lockScreen.style.display = 'none', 500);
                    initializeDashboard();
                } else {
                    lockError.style.display = 'block';
                    passcodeInput.value = '';
                    passcodeInput.focus();
                }
            });
        }
    }
});

// 2. Tab Navigation
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// 3. Real-time Dashboard Sync
let loadedOrders = [];
let loadedProducts = [];
let loadedReviews = [];

function initializeDashboard() {
    console.log("⚙️ Initializing Dashboard Data Sync...");
    syncProducts();
    syncOrders();
    syncReviews();
}

// Toast notification helper
function showToast(message) {
    const toast = document.getElementById('toast-notify');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// Sync Products
function syncProducts() {
    if (window.listenToProducts && typeof window.listenToProducts === 'function') {
        window.listenToProducts((firebaseProducts) => {
            if (firebaseProducts) {
                loadedProducts = firebaseProducts;
            } else {
                // If Firebase has no products, fallback to products.js array
                loadedProducts = products;
                if (window.initializeFirebaseProducts) {
                    window.initializeFirebaseProducts(products);
                }
            }
            renderProductsManager();
            updateStats();
        });
    } else {
        // Fallback or retry
        setTimeout(syncProducts, 1000);
    }
}

// Sync Orders
function syncOrders() {
    if (window.listenToAllOrders && typeof window.listenToAllOrders === 'function') {
        window.listenToAllOrders((firebaseOrders) => {
            loadedOrders = firebaseOrders || [];
            renderOrdersManager();
            updateStats();
        });
    } else {
        setTimeout(syncOrders, 1000);
    }
}

// Sync Reviews
function syncReviews() {
    if (window.listenToAllReviews && typeof window.listenToAllReviews === 'function') {
        window.listenToAllReviews((firebaseReviews) => {
            loadedReviews = firebaseReviews || [];
            renderReviewsManager();
            updateStats();
        });
    } else {
        setTimeout(syncReviews, 1000);
    }
}

// Calculate and render stats cards
function updateStats() {
    // Total Revenue from completed or active orders
    const totalRev = loadedOrders
        .filter(order => order.status !== 'Cancelled')
        .reduce((sum, order) => sum + (parseFloat(order.subtotal) || 0), 0);
    
    document.getElementById('stat-revenue').innerText = `Rs ${totalRev.toLocaleString()}`;
    document.getElementById('stat-orders').innerText = loadedOrders.length;
    document.getElementById('stat-products').innerText = loadedProducts.length;
    document.getElementById('stat-reviews').innerText = loadedReviews.length;
}

// 4. Render Orders Tab
const ordersList = document.getElementById('orders-list');
function renderOrdersManager() {
    ordersList.innerHTML = '';
    if (loadedOrders.length === 0) {
        ordersList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 3rem;">No orders placed yet.</div>`;
        return;
    }

    loadedOrders.forEach(order => {
        const card = document.createElement('div');
        const statusClass = (order.status || 'pending').toLowerCase();
        card.className = `order-card glass-panel ${statusClass}`;
        
        const dateStr = order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A';
        const itemsList = (order.items || []).map(it => `<li><span>${it.name} (x${it.quantity})</span><span>Rs ${it.price * it.quantity}</span></li>`).join('');

        card.innerHTML = `
            <div class="order-info">
                <h4>Order ID: <small style="color: var(--accent-color); font-family: monospace;">${order.id}</small></h4>
                <p><strong>Customer:</strong> ${order.name}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
                <p><strong>Address:</strong> ${order.address}</p>
                <p><strong>Date:</strong> ${dateStr}</p>
            </div>
            <div class="order-items">
                <p style="font-weight: 600; margin-bottom: 0.5rem; color: var(--accent-color);">Ordered Items:</p>
                <ul>
                    ${itemsList}
                </ul>
                <div style="display:flex; justify-content:space-between; font-weight:800; margin-top:0.8rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:0.5rem;">
                    <span>Total Amount:</span>
                    <span>Rs ${order.subtotal}</span>
                </div>
            </div>
            <div class="order-actions">
                <label style="font-size:0.85rem; color:var(--text-muted);">Change Order Status:</label>
                <select class="status-select" data-id="${order.id}">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending 🟡</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing 🔵</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped 🟣</option>
                    <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed 🟢</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled 🔴</option>
                </select>
                <button class="btn-danger delete-order-btn" data-id="${order.id}">🗑️ Delete Order</button>
            </div>
        `;
        ordersList.appendChild(card);
    });

    // Attach order actions event listeners
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const orderId = e.target.getAttribute('data-id');
            const newStatus = e.target.value;
            if (window.updateOrderStatusInFirebase) {
                window.updateOrderStatusInFirebase(orderId, newStatus)
                    .then(() => showToast(`Order ${orderId.substring(0, 6)}... status updated to ${newStatus}!`))
                    .catch(err => console.error("Error updating order status:", err));
            }
        });
    });

    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.target.getAttribute('data-id');
            if (confirm(`Are you sure you want to delete order ID: ${orderId}? This cannot be undone.`)) {
                if (window.deleteOrderFromFirebase) {
                    window.deleteOrderFromFirebase(orderId)
                        .then(() => showToast("🗑️ Order deleted successfully!"))
                        .catch(err => console.error("Error deleting order:", err));
                }
            }
        });
    });
}

// 5. Render Products Tab
const productsList = document.getElementById('products-list');
function renderProductsManager() {
    productsList.innerHTML = '';
    
    loadedProducts.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-item glass-panel';
        
        let imgTag = product.imagePlaceholder || '';
        // If imagePlaceholder doesn't contain img tag, render fallback img tag
        if (!imgTag.includes('<img')) {
            const imgName = product.imageSrc ? product.imageSrc : `images/${product.name.toLowerCase().replace(/ /g, '_')}.jpeg`;
            imgTag = `<img src="${imgName}" alt="${product.name}" onerror="this.outerHTML='${product.name}'" />`;
        }

        item.innerHTML = `
            <div class="product-img-box">
                ${imgTag}
            </div>
            <div class="product-item-info">
                <h4>${product.name}</h4>
                <div>
                    <span>Category: ${product.category}</span>
                    <span>Price: Rs ${product.basePrice}</span>
                </div>
            </div>
            <div class="product-item-actions">
                <button class="btn-secondary edit-product-btn" data-id="${product.id}">✏️ Edit</button>
                <button class="btn-danger delete-product-btn" data-id="${product.id}">🗑️ Delete</button>
            </div>
        `;
        productsList.appendChild(item);
    });

    // Attach product edit/delete action listeners
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prodId = e.target.getAttribute('data-id');
            const product = loadedProducts.find(p => p.id == prodId);
            if (product) {
                openProductModal(product);
            }
        });
    });

    document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prodId = e.target.getAttribute('data-id');
            if (confirm("Are you sure you want to delete this product from the store catalog?")) {
                if (window.deleteProductFromFirebase) {
                    window.deleteProductFromFirebase(prodId)
                        .then(() => showToast("🗑️ Product deleted from store."))
                        .catch(err => console.error("Error deleting product:", err));
                }
            }
        });
    });
}

// Product Modal management
const productModal = document.getElementById('product-modal');
const addProductBtn = document.getElementById('add-product-btn');
const modalClose = document.getElementById('modal-close');
const productForm = document.getElementById('product-form');
const editProductIdInput = document.getElementById('edit-product-id');
const modalTitle = document.getElementById('modal-title');

addProductBtn.addEventListener('click', () => {
    openProductModal();
});

modalClose.addEventListener('click', () => {
    productModal.classList.remove('active');
});

// Close modal if click outside
window.addEventListener('click', (e) => {
    if (e.target === productModal) {
        productModal.classList.remove('active');
    }
});

function openProductModal(product = null) {
    productForm.reset();
    
    if (product) {
        // Edit Mode
        modalTitle.innerText = "✏️ Edit Product Details";
        editProductIdInput.value = product.id;
        document.getElementById('prod-name').value = product.name;
        document.getElementById('prod-category').value = product.category || 'Decor & Others';
        document.getElementById('prod-price').value = product.basePrice;
        
        // Extract filename from imagePlaceholder
        let imgName = '';
        if (product.imagePlaceholder) {
            const srcMatch = product.imagePlaceholder.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) {
                imgName = srcMatch[1].replace('images/', '');
            }
        }
        document.getElementById('prod-image').value = imgName || product.imageSrc || '';
    } else {
        // Add Mode
        modalTitle.innerText = "➕ Add New Product";
        editProductIdInput.value = '';
    }
    
    productModal.classList.add('active');
}

productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const prodId = editProductIdInput.value;
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category').value;
    const basePrice = parseInt(document.getElementById('prod-price').value);
    const imageFilename = document.getElementById('prod-image').value.trim();
    
    // Construct image source
    const imageSrc = imageFilename.startsWith('http') || imageFilename.startsWith('images/') 
        ? imageFilename 
        : `images/${imageFilename}`;

    const imagePlaceholder = `<img src="${imageSrc}" alt="${name}" loading="lazy" onerror="this.outerHTML='${name}'" />`;

    const productObj = {
        name: name,
        category: category,
        basePrice: basePrice,
        imageSrc: imageSrc,
        imagePlaceholder: imagePlaceholder
    };

    if (prodId) {
        // Edit product
        productObj.id = isNaN(prodId) ? prodId : parseInt(prodId);
    } else {
        // Generate a new numeric ID greater than the current maximum ID
        const maxId = loadedProducts.reduce((max, p) => (typeof p.id === 'number' && p.id > max ? p.id : max), 100);
        productObj.id = maxId + 1;
    }

    if (window.saveProductToFirebase) {
        window.saveProductToFirebase(productObj)
            .then(() => {
                productModal.classList.remove('active');
                showToast(prodId ? "✏️ Product details updated successfully!" : "➕ New product added successfully!");
            })
            .catch(err => {
                console.error("Error saving product:", err);
                showToast("⚠️ Firebase error. Could not save product.");
            });
    }
});

// 6. Render Reviews Tab
const reviewsList = document.getElementById('reviews-list');
function renderReviewsManager() {
    reviewsList.innerHTML = '';
    if (loadedReviews.length === 0) {
        reviewsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 3rem;">No reviews submitted yet.</div>`;
        return;
    }

    loadedReviews.forEach(rev => {
        const item = document.createElement('div');
        item.className = 'review-item glass-panel';
        
        const reviewTypeLabel = rev.type === 'website' 
            ? '<span style="color:#ff00ea; font-size:0.8rem; background:rgba(255,0,234,0.08); padding:2px 8px; border-radius:10px;">Store Review</span>'
            : `<span style="color:#38bdf8; font-size:0.8rem; background:rgba(56,189,248,0.08); padding:2px 8px; border-radius:10px;">Product ID: ${rev.productId}</span>`;
        
        item.innerHTML = `
            <div class="review-text">
                <p>"${rev.text}"</p>
                <div style="margin-top: 0.3rem;">
                    <small>By: <strong>${rev.name}</strong> | Rating: <span style="color:#eab308">${rev.stars}</span></small>
                    <span style="margin-left:1rem">${reviewTypeLabel}</span>
                </div>
            </div>
            <div>
                <button class="btn-danger delete-review-btn" data-id="${rev.id}" data-type="${rev.type}" data-prodid="${rev.productId || ''}">Moderate</button>
            </div>
        `;
        reviewsList.appendChild(item);
    });

    // Attach review moderation listeners
    document.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const revId = e.target.getAttribute('data-id');
            const type = e.target.getAttribute('data-type');
            const prodId = e.target.getAttribute('data-prodid');
            
            if (confirm("Are you sure you want to delete/moderate this review?")) {
                if (type === 'website' && window.deleteWebsiteReviewFromFirebase) {
                    window.deleteWebsiteReviewFromFirebase(revId)
                        .then(() => showToast("🗑️ Store review moderated successfully!"))
                        .catch(err => console.error(err));
                } else if (type === 'product' && window.deleteProductReviewFromFirebase) {
                    window.deleteProductReviewFromFirebase(prodId, revId)
                        .then(() => showToast(`🗑️ Product review moderated successfully!`))
                        .catch(err => console.error(err));
                }
            }
        });
    });
}
