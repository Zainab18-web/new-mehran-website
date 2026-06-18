// === FIREBASE DATABASE CONNECTION & SETUP ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

// TODO: Aapne yahan apni Firebase Config details dalni hain!
// Jab aap Firebase me naya project banayenge, tou "Web App" add karne ke baad ye keys milengi:
export const firebaseConfig = {
  apiKey: "AIzaSyD160sN2V6T_mom9Sz3Fqb7xWoGr81x8rc",
  authDomain: "mgiad-3d6eb.firebaseapp.com",
  databaseURL: "https://mgiad-3d6eb-default-rtdb.firebaseio.com",
  projectId: "mgiad-3d6eb",
  storageBucket: "mgiad-3d6eb.firebasestorage.app",
  messagingSenderId: "868908012353",
  appId: "1:868908012353:web:01411629d9b7c366ccc7c0",
  measurementId: "G-5VZPNBZYL3"
};

let database = null;

try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        const app = initializeApp(firebaseConfig);
        database = getDatabase(app);
        console.log("🔥 Firebase Database Successfully Connected!");
    } else {
        console.warn("⚠️ Firebase is not configured yet. Pura real-time chalane ke liye firebaseConfig update karein.");
    }
} catch(e) {
    console.error("Firebase connection error:", e);
}

// Global functions so script.js and admin.js can use them
window.isFirebaseActive = () => database !== null;

// Expose database reference
window.getFirebaseDB = () => database;

window.saveWebsiteReviewToFirebase = (reviewObj) => {
    if (!database) return;
    const dbRef = ref(database, 'websiteReviews');
    const newRef = push(dbRef);
    set(newRef, reviewObj);
};

window.saveProductReviewToFirebase = (productId, reviewObj) => {
    if (!database) return;
    const dbRef = ref(database, `productReviews/${productId}`);
    const newRef = push(dbRef);
    set(newRef, reviewObj);
};

// Orders backend operations
window.saveOrderToFirebase = (orderObj) => {
    if (!database) return Promise.reject("Firebase not active");
    const dbRef = ref(database, 'orders');
    const newRef = push(dbRef);
    const orderId = newRef.key;
    const finalOrder = {
        ...orderObj,
        id: orderId,
        status: 'Pending',
        timestamp: Date.now()
    };
    return set(newRef, finalOrder).then(() => finalOrder);
};

window.updateOrderStatusInFirebase = (orderId, newStatus) => {
    if (!database) return Promise.reject("Firebase not active");
    const orderRef = ref(database, `orders/${orderId}`);
    return update(orderRef, { status: newStatus });
};

window.deleteOrderFromFirebase = (orderId) => {
    if (!database) return Promise.reject("Firebase not active");
    const orderRef = ref(database, `orders/${orderId}`);
    return remove(orderRef);
};

window.deleteWebsiteReviewFromFirebase = (reviewId) => {
    if (!database) return Promise.reject("Firebase not active");
    const reviewRef = ref(database, `websiteReviews/${reviewId}`);
    return remove(reviewRef);
};

window.deleteProductReviewFromFirebase = (productId, reviewId) => {
    if (!database) return Promise.reject("Firebase not active");
    const reviewRef = ref(database, `productReviews/${productId}/${reviewId}`);
    return remove(reviewRef);
};

window.listenToOrder = (orderId, callback) => {
    if (!database) return;
    onValue(ref(database, `orders/${orderId}`), (snapshot) => {
        callback(snapshot.val());
    });
};

window.listenToFirebaseData = () => {
    if (!database) return;

    // 1. Website Reviews Real-Time Sync (including keys as id)
    onValue(ref(database, 'websiteReviews'), (snapshot) => {
        const data = snapshot.val();
        if (data && typeof window.updateWebsiteReviewsFromFirebase === 'function') {
            const reviewsArray = Object.entries(data).map(([key, val]) => ({
                id: key,
                ...val
            })).reverse();
            window.updateWebsiteReviewsFromFirebase(reviewsArray);
        } else if (!data && typeof window.updateWebsiteReviewsFromFirebase === 'function') {
            window.updateWebsiteReviewsFromFirebase([]);
        }
    });

    // 2. Product Reviews Real-Time Sync
    onValue(ref(database, 'productReviews'), (snapshot) => {
        const data = snapshot.val();
        if (data && typeof window.updateProductReviewsFromFirebase === 'function') {
            window.updateProductReviewsFromFirebase(data);
        }
    });
};

// Start listening if active
setTimeout(() => {
    window.listenToFirebaseData();
}, 1000);

// --- PRODUCTS BACKEND OPERATIONS ---
window.listenToProducts = (callback) => {
    if (!database) {
        callback(null);
        return;
    }
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            let productsArray = [];
            // Parse products whether stored as array or object map
            if (Array.isArray(data)) {
                productsArray = data.filter(Boolean); // Filter nulls
            } else {
                productsArray = Object.entries(data).map(([key, val]) => ({
                    ...val,
                    id: isNaN(key) ? key : parseInt(key) // maintain numeric ID if possible
                }));
            }
            callback(productsArray);
        } else {
            callback(null);
        }
    });
};

window.saveProductToFirebase = (productObj) => {
    if (!database) return Promise.reject("Firebase not active");
    const id = productObj.id || push(ref(database, 'products')).key;
    const productRef = ref(database, `products/${id}`);
    const finalProduct = {
        ...productObj,
        id: id
    };
    return set(productRef, finalProduct).then(() => finalProduct);
};

window.deleteProductFromFirebase = (productId) => {
    if (!database) return Promise.reject("Firebase not active");
    const productRef = ref(database, `products/${productId}`);
    return remove(productRef);
};

window.initializeFirebaseProducts = (defaultProducts) => {
    if (!database) return;
    const dbRef = ref(database, 'products');
    defaultProducts.forEach(prod => {
        set(ref(database, `products/${prod.id}`), prod);
    });
    console.log("🔥 Initialized default products in Firebase!");
};

window.listenToAllOrders = (callback) => {
    if (!database) {
        callback([]);
        return;
    }
    onValue(ref(database, 'orders'), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const ordersArray = Object.entries(data).map(([key, val]) => ({
                id: key,
                ...val
            })).reverse(); // show newest first
            callback(ordersArray);
        } else {
            callback([]);
        }
    });
};

window.listenToAllReviews = (callback) => {
    if (!database) {
        callback([]);
        return;
    }
    
    // Listen to website reviews
    onValue(ref(database, 'websiteReviews'), (siteSnapshot) => {
        const siteData = siteSnapshot.val() || {};
        const siteReviews = Object.entries(siteData).map(([key, val]) => ({
            id: key,
            type: 'website',
            ...val
        }));
        
        // Listen to product reviews
        onValue(ref(database, 'productReviews'), (prodSnapshot) => {
            const prodData = prodSnapshot.val() || {};
            const prodReviews = [];
            
            Object.entries(prodData).forEach(([prodId, reviewsMap]) => {
                Object.entries(reviewsMap).forEach(([revId, val]) => {
                    prodReviews.push({
                        id: revId,
                        productId: prodId,
                        type: 'product',
                        ...val
                    });
                });
            });
            
            // Combine and sort by timestamp if available, else show combined list
            const allReviews = [...siteReviews, ...prodReviews].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            callback(allReviews);
        });
    });
};
