
// ==================== cart.js (المصحح بالكامل) ====================
// يدعم الإضافة إلى السلة، عرض المنتجات في صفحة السلة، تحديث الكمية، الحذف

let cart = JSON.parse(localStorage.getItem('pureElegance_cart')) || [];

// حفظ السلة وتحديث العداد وعرض الجدول إن كنا في صفحة السلة
function saveCart() {
    localStorage.setItem('pureElegance_cart', JSON.stringify(cart));
    updateCartCounter();
    // إذا كنا في صفحة cart.html، أعد رسم الجدول
    if (window.location.pathname.includes('cart.html')) {
        renderCartTable();
    }
}

// تحديث العداد الصغير بجانب أيقونة السلة
function updateCartCounter() {
    const counterSpan = document.getElementById('cartCounter');
    if (counterSpan) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        counterSpan.innerText = totalItems;
    }
}

// عرض المنتجات في جدول السلة (لـ cart.html)
function renderCartTable() {
    const tbody = document.getElementById('cart-items');
    const cartContentDiv = document.getElementById('cart-content');
    const emptyCartDiv = document.getElementById('empty-cart');
    
    if (!tbody) return; // ليس في صفحة السلة

    if (cart.length === 0) {
        if (cartContentDiv) cartContentDiv.style.display = 'none';
        if (emptyCartDiv) emptyCartDiv.style.display = 'block';
        return;
    }

    if (cartContentDiv) cartContentDiv.style.display = 'block';
    if (emptyCartDiv) emptyCartDiv.style.display = 'none';

    tbody.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Product">${escapeHtml(item.name)}</td>
            <td data-label="Price">$${item.price.toFixed(2)}</td>
            <td data-label="Quantity">
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}" data-index="${index}">
            </td>
            <td data-label="Subtotal">$${itemTotal.toFixed(2)}</td>
            <td data-label="Remove">
                <button class="remove-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('subtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('total-price').innerText = `$${subtotal.toFixed(2)}`;

    // ربط أحداث الكميات وأزرار الحذف
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.removeEventListener('change', handleQuantityChange);
        input.addEventListener('change', handleQuantityChange);
    });
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.removeEventListener('click', handleRemoveItem);
        btn.addEventListener('click', handleRemoveItem);
    });
}

// منع XSS
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// معالج تغيير الكمية
function handleQuantityChange(event) {
    const input = event.target;
    const id = input.getAttribute('data-id');
    let newQty = parseInt(input.value);
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = newQty;
        saveCart();
    } else {
        // fallback باستخدام index
        const idx = input.getAttribute('data-index');
        if (idx && cart[idx]) {
            cart[idx].quantity = newQty;
            saveCart();
        }
    }
}

// معالج حذف منتج
function handleRemoveItem(event) {
    const btn = event.currentTarget;
    const id = btn.getAttribute('data-id');
    cart = cart.filter(item => item.id !== id);
    saveCart();
}

// إضافة منتج إلى السلة (تُستخدم في صفحات المنتجات)
function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: parseFloat(price),
            quantity: 1
        });
    }
    saveCart();
    showToast(`✨ "${name}" added to cart ✨`);
}

// رسالة منبثقة
function showToast(message, isSuccess = true) {
    let toast = document.createElement('div');
    toast.className = 'toast-notify';
    toast.innerHTML = `<i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 2000);
}

// تهيئة AOS (إذا كنت تستخدمه)
if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true });
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateCartCounter();
    
    // إذا كنا في صفحة السلة، اعرض الجدول
    if (window.location.pathname.includes('cart.html')) {
        renderCartTable();
    }

    // ربط أزرار "إضافة إلى السلة" في صفحات المنتجات
    const addButtons = document.querySelectorAll('.add-to-cart');
    addButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = btn.getAttribute('data-price');
            if (id && name && price) {
                addToCart(id, name, price);
            } else {
                showToast('Error: missing product data', false);
            }
        });
    });
});

// دوال عامة (للتوافق مع أي استخدام آخر)
window.updateQuantity = function(id, quantityVal) {
    let item = cart.find(i => i.id === id);
    if (item) {
        item.quantity = parseInt(quantityVal);
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
    }
};
window.removeItem = function(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
};
