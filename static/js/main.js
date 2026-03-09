/**
 * ============================================================
 * BREW-N-FILL® | Full-Stack E-Commerce Platform (MERN)
 * main.js — Core UI, Cart, Payment & Chat Logic
 * ============================================================
 */

(function ($) {
    "use strict";

    // ─────────────────────────────────────────
    // PAGE SPINNER
    // ─────────────────────────────────────────
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();

    // ─────────────────────────────────────────
    // WOW.JS ANIMATIONS
    // ─────────────────────────────────────────
    new WOW().init();

    // ─────────────────────────────────────────
    // STICKY NAVBAR ON SCROLL
    // ─────────────────────────────────────────
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.navbar').addClass('sticky-top shadow-sm');
        } else {
            $('.navbar').removeClass('sticky-top shadow-sm');
        }
    });

    // ─────────────────────────────────────────
    // DROPDOWN ON MOUSE HOVER (Desktop only)
    // ─────────────────────────────────────────
    const $dropdown       = $(".dropdown");
    const $dropdownToggle = $(".dropdown-toggle");
    const $dropdownMenu   = $(".dropdown-menu");
    const showClass       = "show";

    $(window).on("load resize", function () {
        if (this.matchMedia("(min-width: 992px)").matches) {
            $dropdown.hover(
                function () {
                    const $this = $(this);
                    $this.addClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "true");
                    $this.find($dropdownMenu).addClass(showClass);
                },
                function () {
                    const $this = $(this);
                    $this.removeClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "false");
                    $this.find($dropdownMenu).removeClass(showClass);
                }
            );
        } else {
            $dropdown.off("mouseenter mouseleave");
        }
    });

    // ─────────────────────────────────────────
    // BACK TO TOP BUTTON
    // ─────────────────────────────────────────
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });

    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });

    // ─────────────────────────────────────────
    // COUNTER-UP ANIMATION
    // ─────────────────────────────────────────
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time:  2000
    });

    // ─────────────────────────────────────────
    // YOUTUBE VIDEO MODAL
    // ─────────────────────────────────────────
    $(document).ready(function () {
        var $videoSrc;

        $('.btn-play').click(function () {
            $videoSrc = $(this).data("src");
        });

        $('#videoModal').on('shown.bs.modal', function () {
            $("#video").attr('src', $videoSrc + "?autoplay=1&modestbranding=1&showinfo=0");
        });

        $('#videoModal').on('hide.bs.modal', function () {
            $("#video").attr('src', $videoSrc);
        });
    });

    // ─────────────────────────────────────────
    // OWL CAROUSEL — TESTIMONIALS
    // ─────────────────────────────────────────
    $(".testimonial-carousel").owlCarousel({
        autoplay:   true,
        smartSpeed: 1000,
        center:     true,
        margin:     24,
        dots:       true,
        loop:       true,
        nav:        false,
        responsive: {
            0:   { items: 1 },
            768: { items: 2 },
            992: { items: 3 }
        }
    });

})(jQuery);


// ═══════════════════════════════════════════════════════════════
// SHOPPING CART ENGINE
// ═══════════════════════════════════════════════════════════════

let listProductHTML = document.querySelector('.listProduct');
let listCartHTML    = document.querySelector('.listCart');
let iconCart        = document.querySelector('.icon-cart');
let iconCartSpan    = document.querySelector('.icon-cart span');
let body            = document.querySelector('body');
let closeCart       = document.querySelector('.close');

let products = [];
let cart     = [];

// ─── Cart Sidebar Toggle ───────────────────────────────────────
if (iconCart) {
    iconCart.addEventListener('click', () => {
        body.classList.toggle('showCart');
    });
}

if (closeCart) {
    closeCart.addEventListener('click', () => {
        body.classList.remove('showCart');
    });
}

// ─── Render Products to HTML ──────────────────────────────────
const addDataToHTML = () => {
    if (!listProductHTML) return;
    listProductHTML.innerHTML = '';

    if (products.length > 0) {
        products.forEach(product => {
            let newProduct         = document.createElement('div');
            newProduct.dataset.id  = product.id;
            newProduct.classList.add('item');
            newProduct.innerHTML   = `
                <img src="${product.image}" alt="${product.name}">
                <h2>${product.name}</h2>
                <p class="product-desc">${product.description || ''}</p>
                <div class="price">₹${product.price.toLocaleString('en-IN')}</div>
                <button class="addCart">Add To Cart</button>
            `;
            listProductHTML.appendChild(newProduct);
        });
    }
};

// ─── Add to Cart Event Delegation ─────────────────────────────
if (listProductHTML) {
    listProductHTML.addEventListener('click', (event) => {
        let positionClick = event.target;
        if (positionClick.classList.contains('addCart')) {
            let id_product = positionClick.parentElement.dataset.id;
            addToCart(id_product);
            showToast(`✅ Added to cart!`);
        }
    });
}

// ─── Core Cart Logic ──────────────────────────────────────────
const addToCart = (product_id) => {
    let positionThisProductInCart = cart.findIndex(v => v.product_id == product_id);

    if (cart.length <= 0) {
        cart = [{ product_id: product_id, quantity: 1 }];
    } else if (positionThisProductInCart < 0) {
        cart.push({ product_id: product_id, quantity: 1 });
    } else {
        cart[positionThisProductInCart].quantity += 1;
    }

    addCartToHTML();
    addCartToMemory();
};

// ─── Persist Cart to localStorage ─────────────────────────────
const addCartToMemory = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

// ─── Render Cart Sidebar ──────────────────────────────────────
const addCartToHTML = () => {
    if (!listCartHTML) return;
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let totalPrice    = 0;

    if (cart.length > 0) {
        cart.forEach(item => {
            totalQuantity += item.quantity;
            let positionProduct = products.findIndex(v => v.id == item.product_id);
            let info            = products[positionProduct];
            if (!info) return;

            totalPrice += info.price * item.quantity;

            let newItem = document.createElement('div');
            newItem.classList.add('item');
            newItem.dataset.id = item.product_id;
            newItem.innerHTML  = `
                <div class="image">
                    <img src="${info.image}" alt="${info.name}">
                </div>
                <div class="name">${info.name}</div>
                <div class="totalPrice">₹${(info.price * item.quantity).toLocaleString('en-IN')}</div>
                <div class="quantity">
                    <span class="minus">&#8722;</span>
                    <span>${item.quantity}</span>
                    <span class="plus">&#43;</span>
                </div>
            `;
            listCartHTML.appendChild(newItem);
        });
    }

    // Update cart badge
    if (iconCartSpan) iconCartSpan.innerText = totalQuantity;

    // Update total display
    const totalEl = document.querySelector('.cartTotal');
    if (totalEl) totalEl.innerText = `Total: ₹${totalPrice.toLocaleString('en-IN')}`;
};

// ─── Quantity Controls ────────────────────────────────────────
if (listCartHTML) {
    listCartHTML.addEventListener('click', (event) => {
        let positionClick = event.target;
        if (positionClick.classList.contains('minus') || positionClick.classList.contains('plus')) {
            let product_id = positionClick.parentElement.parentElement.dataset.id;
            let type       = positionClick.classList.contains('plus') ? 'plus' : 'minus';
            changeQuantityCart(product_id, type);
        }
    });
}

const changeQuantityCart = (product_id, type) => {
    let positionItemInCart = cart.findIndex(v => v.product_id == product_id);
    if (positionItemInCart >= 0) {
        if (type === 'plus') {
            cart[positionItemInCart].quantity += 1;
        } else {
            let newQty = cart[positionItemInCart].quantity - 1;
            if (newQty > 0) {
                cart[positionItemInCart].quantity = newQty;
            } else {
                cart.splice(positionItemInCart, 1);
            }
        }
    }
    addCartToHTML();
    addCartToMemory();
};


// ═══════════════════════════════════════════════════════════════
// PAYMENT ENGINE — RAZORPAY
// ═══════════════════════════════════════════════════════════════

/**
 * Calculates total cart amount.
 */
function calculateTotalAmount() {
    return cart.reduce((total, item) => {
        let product = products.find(p => p.id == item.product_id);
        return product ? total + product.price * item.quantity : total;
    }, 0);
}

/**
 * Creates Razorpay order and opens payment modal.
 */
async function handlePayment(totalAmount) {
    try {
        const response = await fetch('/create-order', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ amount: totalAmount, currency: 'INR' }),
        });

        const data = await response.json();
        if (!data.id) throw new Error('Order creation failed');

        const options = {
            key:      'YOUR_RAZORPAY_KEY_ID', // Set from server in production
            amount:   data.amount,
            currency: data.currency,
            name:     'BREW-N-FILL®',
            description: 'Premium Coffee Order',
            image:    'img/hero.png',
            order_id: data.id,
            handler: async function (response) {
                // Verify payment on server
                const verifyRes = await fetch('/verify-payment', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({
                        razorpay_order_id:   response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature:  response.razorpay_signature,
                    }),
                });
                const verifyData = await verifyRes.json();

                if (verifyData.success) {
                    // Clear cart after successful payment
                    cart = [];
                    addCartToHTML();
                    addCartToMemory();
                    body.classList.remove('showCart');
                    showToast('🎉 Order placed successfully! Thank you for choosing BREW-N-FILL®');
                } else {
                    showToast('❌ Payment verification failed. Please contact support.', 'error');
                }
            },
            prefill: {
                name:    '',
                email:   '',
                contact: '',
            },
            theme: { color: '#FEA116' },
        };

        const razorpay = new Razorpay(options);
        razorpay.open();

        razorpay.on('payment.failed', function (response) {
            showToast(`❌ Payment failed: ${response.error.description}`, 'error');
        });

    } catch (err) {
        console.error('Payment error:', err);
        showToast('❌ Unable to initiate payment. Please try again.', 'error');
    }
}

// Checkout button event
const checkoutBtn = document.querySelector('.checkOut');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () {
        if (cart.length === 0) {
            showToast('🛒 Your cart is empty! Add some coffee first.', 'warning');
            return;
        }
        const totalAmount = calculateTotalAmount();
        handlePayment(totalAmount);
    });
}


// ═══════════════════════════════════════════════════════════════
// AI CHATBOT — IBM WATSON INTEGRATION
// ═══════════════════════════════════════════════════════════════

let watsonSessionId = null;

/**
 * Sends a message to Watson via the server proxy and renders the reply.
 */
async function sendChatMessage(userMessage) {
    if (!userMessage.trim()) return;

    appendChatMessage(userMessage, 'user');

    const typingEl = appendTypingIndicator();

    try {
        const response = await fetch('/chat', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ message: userMessage, sessionId: watsonSessionId }),
        });

        const data = await response.json();

        if (data.sessionId) watsonSessionId = data.sessionId;

        typingEl.remove();
        appendChatMessage(data.reply || "I'm here to help! ☕", 'bot');

        // Update sentiment badge
        if (data.sentiment) {
            updateSentimentBadge(data.sentiment);
        }

    } catch (err) {
        typingEl.remove();
        appendChatMessage("I'm having trouble connecting right now. Please try again or call us at +91 8125268128 ☕", 'bot');
    }
}

function appendChatMessage(text, sender) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const msgDiv  = document.createElement('div');
    msgDiv.classList.add('message');

    const bubble  = document.createElement('div');
    bubble.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    bubble.textContent = text;

    msgDiv.appendChild(bubble);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return msgDiv;
}

function appendTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return { remove: () => {} };

    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'typing-indicator');
    typingDiv.innerHTML = '<div class="bot-message">☕ Brewing a reply...</div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return typingDiv;
}

function updateSentimentBadge(sentiment) {
    const badge = document.getElementById('sentiment-result');
    if (!badge) return;

    const icons = { POSITIVE: '😊', NEGATIVE: '😞', NEUTRAL: '😐' };
    const colors = { POSITIVE: '#2e7d32', NEGATIVE: '#c62828', NEUTRAL: '#1565c0' };

    badge.textContent   = `${icons[sentiment] || '🤔'} Sentiment: ${sentiment}`;
    badge.style.color   = colors[sentiment] || '#000';
    badge.style.borderColor = colors[sentiment] || '#000';
}

// Chat send button and Enter key
const chatSendBtn = document.getElementById('chat-send');
const chatInput   = document.getElementById('chat-input');

if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', () => {
        const msg = chatInput.value.trim();
        if (msg) {
            sendChatMessage(msg);
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            chatSendBtn.click();
        }
    });
}


// ═══════════════════════════════════════════════════════════════
// FRANCHISE ENQUIRY FORM
// ═══════════════════════════════════════════════════════════════

const franchiseForm = document.getElementById('franchise-form');
if (franchiseForm) {
    franchiseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name:     document.getElementById('franchise-name')?.value,
            email:    document.getElementById('franchise-email')?.value,
            phone:    document.getElementById('franchise-phone')?.value,
            datetime: document.getElementById('datetime')?.value,
            message:  document.getElementById('franchise-message')?.value,
        };

        try {
            const res  = await fetch('/franchise-enquiry', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(formData),
            });
            const data = await res.json();
            showToast(data.message || '✅ Enquiry received!');
            franchiseForm.reset();
        } catch (err) {
            showToast('❌ Failed to send enquiry. Please call us directly.', 'error');
        }
    });
}


// ═══════════════════════════════════════════════════════════════
// NEWSLETTER SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════

const newsletterBtn = document.getElementById('newsletter-btn');
if (newsletterBtn) {
    newsletterBtn.addEventListener('click', async () => {
        const emailInput = document.getElementById('newsletter-email');
        const email = emailInput?.value?.trim();

        if (!email || !email.includes('@')) {
            showToast('⚠️ Please enter a valid email address.', 'warning');
            return;
        }

        try {
            const res  = await fetch('/newsletter', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email }),
            });
            const data = await res.json();
            showToast(data.message || '✅ Subscribed successfully!');
            if (emailInput) emailInput.value = '';
        } catch (err) {
            showToast('❌ Failed to subscribe. Please try again.', 'error');
        }
    });
}


// ═══════════════════════════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════

function showToast(message, type = 'success') {
    const colors = {
        success: '#2e7d32',
        error:   '#c62828',
        warning: '#e65100',
    };

    const toast      = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
        position:     'fixed',
        bottom:       '30px',
        right:        '30px',
        background:   colors[type] || colors.success,
        color:        '#fff',
        padding:      '14px 24px',
        borderRadius: '8px',
        fontSize:     '15px',
        fontWeight:   '500',
        zIndex:       '99999',
        maxWidth:     '360px',
        boxShadow:    '0 4px 20px rgba(0,0,0,0.25)',
        transition:   'opacity 0.4s ease',
        opacity:      '0',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}


// ═══════════════════════════════════════════════════════════════
// APP INITIALIZATION
// ═══════════════════════════════════════════════════════════════

const initApp = () => {
    fetch('/products')
        .then(res => res.json())
        .then(data => {
            products = data;
            addDataToHTML();

            // Restore cart from localStorage
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                try {
                    cart = JSON.parse(savedCart);
                    addCartToHTML();
                } catch (_) {
                    cart = [];
                }
            }
        })
        .catch(err => {
            console.error('Failed to load products:', err);
        });
};

initApp();
