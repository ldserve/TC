class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);
    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );
  }

  open() {
    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener('transitionend', () => {
      this.notification.focus();
      trapFocus(this.notification);
    }, { once: true });

    document.body.addEventListener('click', this.onBodyClick);
  }

  close() {
    this.notification.classList.remove('active');

    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(response) {
      fetch('/cart.js').then(response=>response.json()).then(data=>{
        const count =document.querySelector("#cart-icon-bubble .cart-count-bubble")
        const productLists=document.getElementById('cart-notification-product')
        const cartBtn=document.getElementById('cart-notification-button')
        count&&(count.innerHTML=`<span aria-hidden="true">${data.item_count}</span><span class="visually-hidden">${data.item_count} items</span>`)
        productLists&&(productLists.innerHTML=this.getSectionInnerHTML(response))
        cartBtn.innerHTML="View my cart ("+data.item_count+")"
        if(!count){
          const cart=document.getElementById('cart-icon-bubble')
          const count =document.createElement('div')
          count.className="cart-count-bubble"
          count.innerHTML=`<span aria-hidden="true">${data.item_count}</span><span class="visually-hidden">${data.item_count} items</span>`
          cart.appendChild(count)
        }
      })

      if (this.header) this.header.reveal();
      this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-notification-product',
        selector: `[id="cart-notification-product-${this.cartItemKey}"]`,
      },
      {
        id: 'cart-notification-button'
      },
      {
        id: 'cart-icon-bubble'
      }
    ];
  }

  getSectionInnerHTML(response) {
    return `<div class="cart-notification-product__image global-media-settings">
      <img src="${response.image}&width=70" alt="${response.product_title}}" width="70" height="70" loading="lazy">
  </div> <div> <h3 class="cart-notification-product__name h4">${response.product_title}</h3>
    <dl><div class="product-option"><dt>COLOR: </dt><dd>${response.variant_options[0]}</dd></div><div class="product-option">
    <dt>SIZE: </dt><dd>${response.variant_options[1]}</dd></div></dl> </div>`
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-notification', CartNotification);
