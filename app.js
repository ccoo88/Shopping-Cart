const productList = document.querySelector(".productList");
const cartBox = document.querySelector(".cart");
const cartQtySpan = document.querySelector(".cartQty");
const emptyCart = document.querySelector(".emptyStatus");
const itemList = document.querySelector(".itemList");
const orderedList = document.querySelector(".orderedList");
const cartIconBox = document.querySelector(".cartIconBox");
const iconQuantity = document.querySelector(".iconQuantity");

let carts = [];
let products = [];

const loadProducts = () => {
  fetch("data.json")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch the data.");
      return response.json();
    })
    .then((data) => {
      products = data;
      getLocalStorage();
      renderProducts();
    })
    .catch((error) => {
      console.log(error.message);
      alert(`Error: ${error.message}`);
    });
};
loadProducts();

function getLocalStorage() {
  const savedCart = localStorage.getItem("carts");
  if (savedCart) {
    carts = JSON.parse(savedCart);
    renderCarts(); // 讀取資料後要記得渲染
  }
}
function saveToLocalStorage() {
  localStorage.setItem("carts", JSON.stringify(carts));
}

function updateCartUI() {
  try {
    saveToLocalStorage(); // 優先確保資料儲存成功
    renderCarts(); // 然後再更新畫面
  } catch (error) {
    console.error("Failed to update the cart:", error);
    alert("Failed to update the cart. Please try again later.");
  }
}

// 創建元素的工具函數
function createEl(tagName, className, parent) {
  const el = document.createElement(tagName);
  if (className) el.classList.add(className);
  if (parent) parent.appendChild(el);
  return el;
}

function renderProducts() {
  productList.innerHTML = "";
  products.forEach((product) => {
    const newProduct = createEl("div", "product", productList);
    newProduct.dataset.id = product.id;
    newProduct.innerHTML = `
    <img src="${product.image.desktop}"
         alt="${product.name}"/>
    <div class="control">
        <button class="addToCartBtn">
            <img src="assets/images/icon-add-to-cart.svg" alt="" />
            <span>Add to Cart</span>
        </button>
        <div class="qtyController">
            <button class="minus">-</button>
            <span class="qty">1</span>
            <button class="plus">+</button>
        </div>
    </div>
    <div class="desc">
        <span>${product.category}</span>
        <h4>${product.name}</h4>
        <span class="price">$${product.price.toFixed(2)}</span>
    </div>`;

    // DOM 元素在頁面刷新後重新建立，但不會知道哪些是已經在購物車中的
    // 所以若是已經在購物車中就直接加上 .active 並將數量更新成正確的
    updateExistingCartItem(product, newProduct);

    const addToCartBtn = newProduct.querySelector(".addToCartBtn");
    const qtyController = newProduct.querySelector(".qtyController");
    const productPrice = product.price;
    const productId = product.id;

    bindAddToCartBtn(addToCartBtn, productId, productPrice);
    bindQtyControllerBtn(qtyController, productId, productPrice);
  });
}

function updateExistingCartItem(product, newProduct) {
  const existingCartItem = carts.find((item) => item.productId === product.id);
  if (existingCartItem) {
    newProduct.classList.add("active");
    const qty = newProduct.querySelector(".qty");
    qty.textContent = existingCartItem.quantity;
  }
}

function bindAddToCartBtn(addToCartBtn, productId, productPrice) {
  addToCartBtn.addEventListener("click", function () {
    const thisProduct = this.closest(".product");
    thisProduct.classList.add("active");
    updateCart(productId, productPrice);
    saveToLocalStorage();
  });
}

function updateCart(productId, productPrice) {
  carts.push({
    productId: productId,
    quantity: 1,
    price: productPrice,
  });
  updateCartUI();
}

function bindQtyControllerBtn(qtyController, productId, productPrice) {
  qtyController.addEventListener("click", function (e) {
    const thisProduct = this.closest(".product");
    adjustQuantity(e, thisProduct, productId, productPrice);
  });
}

function adjustQuantity(e, thisProduct, productId, productPrice) {
  const thisProductIndexInCart = carts.findIndex(
    (value) => value.productId === productId
  );
  const cartItem = carts[thisProductIndexInCart];
  const qty = thisProduct.querySelector(".qty");

  if (e.target.classList.contains("minus")) {
    if (cartItem.quantity > 1) {
      cartItem.quantity--;
      cartItem.price -= productPrice;
      qty.textContent = cartItem.quantity;
    } else if (cartItem.quantity === 1) {
      carts.splice(thisProductIndexInCart, 1);
      thisProduct.classList.remove("active");
    }
  } else if (e.target.classList.contains("plus")) {
    cartItem.quantity++;
    cartItem.price += productPrice;
    qty.textContent = cartItem.quantity;
  }
  updateCartUI();
}

function renderCarts() {
  emptyCart.style.display = "none";
  itemList.innerHTML = "";

  let totalPrice = 0;
  let totalQuantity = 0;

  carts.forEach((item) => {
    totalPrice += item.price;
    totalQuantity += item.quantity;

    const newItem = createEl("div", "item", itemList);
    newItem.dataset.id = item.productId;
    const thisItemIndexInProducts = products.findIndex(
      (value) => value.id === item.productId
    );
    const info = products[thisItemIndexInProducts];
    if (thisItemIndexInProducts !== -1) {
      newItem.innerHTML = `
        <h4>${info.name}</h4>
        <div>
          <span class="itemQty">${item.quantity}x</span>
          <span class="itemPrice">@${info.price.toFixed(2)}</span>
          <span class="itemTotalPrice">
            $${(item.quantity * info.price).toFixed(1)}
          </span>
        </div>
        <button class="removeBtn">
          <img src="assets/images/icon-remove-item.svg" alt="" />
        </button>
      `;
    }
    const removeBtn = newItem.querySelector(".removeBtn");
    bindRemoveBtn(removeBtn);
  });

  cartQtySpan.textContent = `(${totalQuantity})`;
  iconQuantity.textContent = `${totalQuantity}`;

  renderCheckBox(totalPrice);
}

function bindRemoveBtn(removeBtn) {
  removeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    const thisItem = this.closest(".item");
    const itemId = thisItem.dataset.id;
    removeItem(itemId);
  });
}
function removeItem(itemId) {
  const thisProductIndexInCart = carts.findIndex(
    (value) => value.productId == itemId
  );
  if (thisProductIndexInCart >= 0) {
    carts.splice(thisProductIndexInCart, 1);
    updateCartUI();
  }
  resetActiveProduct(itemId);
}

function resetActiveProduct(itemId) {
  const removedProduct = document.querySelector(
    `.product[data-id='${itemId}']`
  );
  const qty = removedProduct.querySelector(".qty");
  removedProduct.classList.remove("active");
  qty.textContent = 1;
}

function renderCheckBox(totalPrice) {
  let check = document.querySelector(".check");
  // 檢查check區塊是否已經存在，若不存在再創建
  if (!check) check = createEl("div", "check", cartBox);

  // 寫在這裡，無論是否已經存在都能夠更新內容顯示
  check.innerHTML = `
     <div class="totalPriceBox">
       <span>Order Total</span>
       <span class="totalPrice">$${totalPrice.toFixed(2)}</span>
     </div>
     <div class="notation">
       <img src="assets/images/icon-carbon-neutral.svg" alt="" />
       <p>This is a <strong>carbon-neutral</strong> delivery</p>
     </div>
     <button class="confirmBtn">Confirm Order</button>
   `;

  if (carts.length <= 0) {
    check.style.display = "none";
    emptyCart.style.display = "grid";
  } else {
    check.style.display = "grid";
  }

  const confirmBtn = document.querySelector(".confirmBtn");
  const confirmBox = document.querySelector(".confirmBox");
  const modifyBtn = document.querySelector(".modifyBtn");

  // 讓不支援 showModal() 的瀏覽器能夠模擬這個功能
  if (!confirmBox.showModal) {
    dialogPolyfill.registerDialog(confirmBox);
  }
  
  confirmBtn.addEventListener("click", () => {
    confirmBox.showModal();
    renderOrderList(totalPrice);
  });
  modifyBtn.addEventListener("click", () => {
    confirmBox.close();
  });
}

function renderOrderList(totalPrice) {
  orderedList.innerHTML = "";

  carts.forEach((item) => {
    const thisItemIndexInProducts = products.findIndex(
      (value) => value.id === item.productId
    );
    const info = products[thisItemIndexInProducts];

    const newOrderedItem = createEl("div", "orderedItem", orderedList);
    newOrderedItem.dataset.id = item.productId;

    newOrderedItem.innerHTML = `
      <img src="${info.image.thumbnail}" alt="" />
      <div class="orderedItemDesc">
        <h4>${info.name}</h4>
        <div>
          <span class="orderedItemQty">${item.quantity}x</span>
          <span class="orderedItemPrice">@${info.price}</span>
        </div>
        <span class="orderedItemTotalPrice">
          $${(item.quantity * info.price).toFixed(2)}
        </span>
      </div>`;

    const orderTotal = document.querySelector(".orderTotal");
    orderTotal.textContent = `$${totalPrice.toFixed(2)}`;
  });
}

cartIconBox.addEventListener("click", (e) => {
  e.stopPropagation(); // 阻止 document 上的 click 被觸發
  cartBox.classList.toggle("showCart");
});

document.addEventListener("click", (e) => {
  if (!cartBox.contains(e.target)) cartBox.classList.remove("showCart");
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 600) cartBox.classList.remove("showCart");
});
