// Global variables
let products = [];
let categories = [];
let cart = [];
let wishlist = [];

// DOM Elements
const productGrid = document.getElementById('productGrid');
const searchInput = document.querySelector('.search-box input');
const cartCount = document.querySelector('.cart-count');
const wishlistCount = document.querySelector('.wishlist-count');
const cartBtn = document.getElementById('cartBtn');
const wishlistBtn = document.getElementById('wishlistBtn');
const cartModal = document.getElementById('cartModal');
const wishlistModal = document.getElementById('wishlistModal');
const quickViewModal = document.getElementById('quickViewModal');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');

// Fetch and load products
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        products = data.products;
        categories = data.categories;
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Display products in the grid
function displayProducts(productsToShow) {
    productGrid.innerHTML = '';
    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <button class="quick-view-btn" onclick="showQuickView(${product.id})">
            <i class="fas fa-eye"></i>
        </button>
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="price">$${product.price.toFixed(2)}</p>
            <div class="rating">
                ${createStarRating(product.rating)}
                <span>(${product.rating})</span>
            </div>
            <p class="description">${product.description}</p>
            <div class="product-actions">
                <button onclick="addToCart(${product.id})" class="add-to-cart">
                    Add to Cart
                </button>
                <button onclick="addToWishlist(${product.id})" class="wishlist-btn">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `;
    return card;
}

// Create star rating display
function createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Update cart count
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

// Add to cart function
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCartCount();
        showNotification('Product added to cart!');
        updateCartModal();
    }
}

// Remove from cart function
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    updateCartModal();
    showNotification('Product removed from cart!');
}

// Update cart modal content
function updateCartModal() {
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    
    if (cartItems) {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="price">$${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity || 1}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        cartTotal.innerHTML = `
            <div class="cart-summary">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <button class="checkout-btn" onclick="checkout()">Proceed to Checkout</button>
        `;
    }
}

// Update quantity function
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, (item.quantity || 1) + change);
        updateCartModal();
    }
}

// Checkout functionality
function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    openModal('checkoutModal');
    updateOrderSummary();
}

// Update order summary
function updateOrderSummary() {
    const orderItems = document.querySelector('.order-items');
    const subtotalElement = document.querySelector('.subtotal');
    const shippingElement = document.querySelector('.shipping');
    const taxElement = document.querySelector('.tax');
    const grandTotalElement = document.querySelector('.grand-total');

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const shipping = subtotal > 100 ? 0 : 10;
    const tax = subtotal * 0.15; // 15% tax
    const grandTotal = subtotal + shipping + tax;

    // Update order items
    orderItems.innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="order-item-details">
                <h4>${item.name}</h4>
                <p>Quantity: ${item.quantity || 1}</p>
                <p class="order-item-price">$${(item.price * (item.quantity || 1)).toFixed(2)}</p>
            </div>
        </div>
    `).join('');

    // Update totals
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    shippingElement.textContent = `$${shipping.toFixed(2)}`;
    taxElement.textContent = `$${tax.toFixed(2)}`;
    grandTotalElement.textContent = `$${grandTotal.toFixed(2)}`;
}

// Checkout form handling
const checkoutForm = document.getElementById('checkoutForm');
let currentStep = 1;

// Next step button
document.querySelector('.next-step').addEventListener('click', () => {
    if (validateCurrentStep()) {
        currentStep++;
        updateCheckoutSteps();
    }
});

// Previous step button
document.querySelector('.prev-step').addEventListener('click', () => {
    currentStep--;
    updateCheckoutSteps();
});

// Update checkout steps
function updateCheckoutSteps() {
    // Update step indicators
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        if (stepNum < currentStep) {
            step.classList.add('active');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Show/hide steps
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.style.display = step.id === `step${currentStep}` ? 'block' : 'none';
    });

    // Update buttons
    const prevButton = document.querySelector('.prev-step');
    const nextButton = document.querySelector('.next-step');
    const placeOrderButton = document.querySelector('.place-order');

    prevButton.style.display = currentStep === 1 ? 'none' : 'block';
    nextButton.style.display = currentStep === 3 ? 'none' : 'block';
    placeOrderButton.style.display = currentStep === 3 ? 'block' : 'none';
}

// Validate current step
function validateCurrentStep() {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const inputs = currentStepElement.querySelectorAll('input[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });

    if (!isValid) {
        showNotification('Please fill in all required fields', 'error');
    }

    return isValid;
}

// Handle form submission
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (validateCurrentStep()) {
        // Collect form data
        const formData = {
            shipping: {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                postalCode: document.getElementById('postalCode').value,
                country: document.getElementById('country').value
            },
            payment: {
                cardNumber: document.getElementById('cardNumber').value,
                expiryDate: document.getElementById('expiryDate').value,
                cvv: document.getElementById('cvv').value,
                cardName: document.getElementById('cardName').value
            },
            order: {
                items: cart,
                subtotal: parseFloat(document.querySelector('.subtotal').textContent.replace('$', '')),
                shipping: parseFloat(document.querySelector('.shipping').textContent.replace('$', '')),
                tax: parseFloat(document.querySelector('.tax').textContent.replace('$', '')),
                total: parseFloat(document.querySelector('.grand-total').textContent.replace('$', ''))
            }
        };

        // Here you would typically send this data to your backend
        console.log('Order submitted:', formData);

        // Clear cart and show success message
        cart = [];
        updateCartCount();
        closeModal('checkoutModal');
        showNotification('Order placed successfully! Thank you for your purchase.');
    }
});

// Format card number input
document.getElementById('cardNumber').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16);
});

// Format expiry date input
document.getElementById('expiryDate').addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
});

// Format CVV input
document.getElementById('cvv').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// Show notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
});

// Newsletter form submission
const newsletterForm = document.querySelector('.newsletter-form');
newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector('input[type="email"]').value;
    showNotification('Thank you for subscribing!');
    newsletterForm.reset();
});

// Contact form submission
const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotification('Message sent successfully!');
    contactForm.reset();
});

// Add some CSS for notifications
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        animation: slideIn 0.3s ease-out;
        z-index: 1000;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .product-card {
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: var(--shadow);
        transition: transform 0.3s ease;
    }

    .product-card:hover {
        transform: translateY(-5px);
    }

    .product-card img {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }

    .product-info {
        padding: 1rem;
    }

    .product-info h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-color);
    }

    .price {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--primary-color);
        margin: 0.5rem 0;
    }

    .rating {
        color: #ffd700;
        margin: 0.5rem 0;
    }

    .rating span {
        color: var(--text-color);
        margin-left: 0.5rem;
    }

    .description {
        color: #666;
        margin: 0.5rem 0;
        font-size: 0.9rem;
    }

    .add-to-cart {
        width: 100%;
        padding: 0.8rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .add-to-cart:hover {
        background: var(--primary-dark);
    }
`;
document.head.appendChild(style);

// Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// Close modal with escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal.id);
        }
    }
});

// Cart functionality
cartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('cartModal');
    updateCartModal();
});

// Wishlist functionality
wishlistBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('wishlistModal');
    updateWishlistDisplay();
});

function updateWishlistDisplay() {
    const wishlistItems = document.querySelector('.wishlist-items');
    wishlistItems.innerHTML = wishlist.map(item => `
        <div class="wishlist-item">
            <button class="remove-wishlist" onclick="removeFromWishlist(${item.id})">
                <i class="fas fa-times"></i>
            </button>
            <img src="${item.image}" alt="${item.name}">
            <div class="wishlist-item-info">
                <h3 class="wishlist-item-title">${item.name}</h3>
                <p class="wishlist-item-price">$${item.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

function addToWishlist(productId) {
    const product = products.find(p => p.id === productId);
    if (product && !wishlist.find(item => item.id === productId)) {
        wishlist.push(product);
        updateWishlistCount();
        showNotification('Added to wishlist!');
    }
}

function removeFromWishlist(productId) {
    wishlist = wishlist.filter(item => item.id !== productId);
    updateWishlistCount();
    updateWishlistDisplay();
    showNotification('Removed from wishlist');
}

function updateWishlistCount() {
    wishlistCount.textContent = wishlist.length;
}

// Quick View functionality
function showQuickView(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const quickViewContent = document.querySelector('.quick-view-content');
        quickViewContent.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="quick-view-image">
            <div class="quick-view-info">
                <h3>${product.name}</h3>
                <p class="quick-view-price">$${product.price.toFixed(2)}</p>
                <div class="rating">
                    ${createStarRating(product.rating)}
                    <span>(${product.rating})</span>
                </div>
                <p class="quick-view-description">${product.description}</p>
                <div class="quick-view-actions">
                    <button onclick="addToCart(${product.id})" class="add-to-cart">
                        Add to Cart
                    </button>
                    <button onclick="addToWishlist(${product.id})" class="wishlist-btn">
                        Add to Wishlist
                    </button>
                </div>
            </div>
        `;
        openModal('quickViewModal');
    }
}

// Product filtering and sorting
categoryFilter.addEventListener('change', filterAndSortProducts);
sortFilter.addEventListener('change', filterAndSortProducts);

function filterAndSortProducts() {
    let filteredProducts = [...products];
    
    // Apply category filter
    const selectedCategory = categoryFilter.value;
    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
            product.category === selectedCategory
        );
    }
    
    // Apply sorting
    const sortBy = sortFilter.value;
    switch (sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        default:
            // Keep original order
            break;
    }
    
    displayProducts(filteredProducts);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load products
    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            products = data.products;
            displayProducts(products);
        })
        .catch(error => console.error('Error loading products:', error));

    // Initialize cart count
    updateCartCount();
}); 