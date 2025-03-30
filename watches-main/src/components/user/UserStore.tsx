import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  ChevronLeft,
  Check,
  MapPin,
  WalletCards,
} from "lucide-react";
import "./user.css";

interface Watch {
  product_id: string;
  name: string;
  price: number;
  category_id: "luxury" | "premium" | "affordable";
  primary_image: string;
  description: string;
  stock_quantity: number;
}

interface CartItem extends Watch {
  quantity: number;
  cart_item_id?: string;
}

interface Order {
  order_id: string;
  items: {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
  }[];
  total_amount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  delivery_info: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  order_date: string;
  order_number: string;
  payment_method: string;
}

interface Address {
  address_id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface PaymentMethod {
  method_id: string;
  type: "credit_card" | "paypal" | "bank_transfer";
  details: {
    last4?: string;
    brand?: string;
    email?: string;
  };
  is_default: boolean;
}

const UserStore = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State declarations
  const [watches, setWatches] = useState<Watch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("store");
  const [showCheckout, setShowCheckout] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, "address_id" | "is_default">>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Philippines",
    phone: "",
  });
  const [addedToCartNotification, setAddedToCartNotification] = useState({
    show: false,
    watchName: "",
  });
  const [isLoading, setIsLoading] = useState({
    watches: true,
    orders: true,
    addresses: true,
    paymentMethods: true,
    checkout: false,
  });
  const [error, setError] = useState({
    watches: "",
    orders: "",
    addresses: "",
    paymentMethods: "",
    checkout: "",
  });

  // Filter watches based on search term and price filter
  const filteredWatches = useMemo(() => {
    return watches.filter(watch => {
      const matchesSearch = watch.name.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesPrice = true;
      
      if (priceFilter === "under500") {
        matchesPrice = watch.price < 500;
      } else if (priceFilter === "500to1000") {
        matchesPrice = watch.price >= 500 && watch.price <= 1000;
      } else if (priceFilter === "over1000") {
        matchesPrice = watch.price > 1000;
      }
      
      return matchesSearch && matchesPrice;
    });
  }, [watches, searchTerm, priceFilter]);

  // Calculate total price of items in cart
  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // Fetch data when component mounts or authentication changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading({
          watches: true,
          orders: true,
          addresses: true,
          paymentMethods: true,
          checkout: false,
        });

        // Fetch watches
        const watchesResponse = await fetch('/api/products');
        if (!watchesResponse.ok) throw new Error('Failed to fetch watches');
        const watchesData = await watchesResponse.json();
        setWatches(watchesData);

        if (isAuthenticated && user) {
          // Fetch user-specific data
          const [cartResponse, ordersResponse, addressesResponse, paymentMethodsResponse] = 
            await Promise.all([
              fetch(`/api/cart/${user.userId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              }),
              fetch('/api/orders', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              }),
              fetch('/api/users/addresses', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              }),
              fetch('/api/users/payment-methods', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              })
            ]);

          // Process responses
          if (cartResponse.ok) {
            const cartData = await cartResponse.json();
            setCart(cartData.items);
          }

          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            setOrders(ordersData);
          }

          if (addressesResponse.ok) {
            const addressesData = await addressesResponse.json();
            setAddresses(addressesData);
            const defaultAddress = addressesData.find((addr: Address) => addr.is_default);
            if (defaultAddress) setSelectedAddressId(defaultAddress.address_id);
          }

          if (paymentMethodsResponse.ok) {
            const paymentMethodsData = await paymentMethodsResponse.json();
            setPaymentMethods(paymentMethodsData);
            const defaultMethod = paymentMethodsData.find((method: PaymentMethod) => method.is_default);
            if (defaultMethod) setSelectedPaymentMethodId(defaultMethod.method_id);
          }
        }

        setIsLoading({
          watches: false,
          orders: false,
          addresses: false,
          paymentMethods: false,
          checkout: false,
        });
      } catch (err) {
        setError({
          watches: err instanceof Error ? err.message : 'Failed to load watches',
          orders: err instanceof Error ? err.message : 'Failed to load orders',
          addresses: err instanceof Error ? err.message : 'Failed to load addresses',
          paymentMethods: err instanceof Error ? err.message : 'Failed to load payment methods',
          checkout: ""
        });
        setIsLoading({
          watches: false,
          orders: false,
          addresses: false,
          paymentMethods: false,
          checkout: false,
        });
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  // Add item to cart
  const addToCart = async (watch: Watch) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const existingItem = cart.find(item => item.product_id === watch.product_id);
      let newCart: CartItem[];

      if (existingItem) {
        newCart = cart.map(item =>
          item.product_id === watch.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...cart, { ...watch, quantity: 1 }];
      }

      setCart(newCart);
      
      if (user) {
        const response = await fetch(`/api/cart/${user.userId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            product_id: watch.product_id,
            quantity: 1
          })
        });

        if (!response.ok) throw new Error('Failed to update cart');
      }

      setAddedToCartNotification({
        show: true,
        watchName: watch.name
      });
      setTimeout(() => setAddedToCartNotification({ show: false, watchName: "" }), 3000);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    try {
      const itemToRemove = cart.find(item => item.product_id === productId);
      if (!itemToRemove) return;

      const newCart = cart.filter(item => item.product_id !== productId);
      setCart(newCart);
      
      if (user && itemToRemove.cart_item_id) {
        await fetch(`/api/cart/items/${itemToRemove.cart_item_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  // Update item quantity in cart
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const itemToUpdate = cart.find(item => item.product_id === productId);
      if (!itemToUpdate) return;

      const newCart = cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCart(newCart);
      
      if (user && itemToUpdate.cart_item_id) {
        await fetch(`/api/cart/items/${itemToUpdate.cart_item_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            quantity: newQuantity
          })
        });
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  // Handle checkout process
  const handleCheckout = async () => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    setIsLoading(prev => ({ ...prev, checkout: true }));
    setError(prev => ({ ...prev, checkout: "" }));

    try {
      const selectedAddress = addresses.find(addr => addr.address_id === selectedAddressId);
      const selectedPaymentMethod = paymentMethods.find(method => method.method_id === selectedPaymentMethodId);

      if (!selectedAddress || !selectedPaymentMethod) {
        throw new Error('Please select an address and payment method');
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          customer_id: user.userId,
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          })),
          address_id: selectedAddress.address_id,
          payment_method: selectedPaymentMethod.type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const newOrder = await response.json();
      setOrders(prev => [newOrder, ...prev]);
      setCart([]);
      setShowCheckout(false);
      setActiveTab("orders");
    } catch (err) {
      setError(prev => ({
        ...prev,
        checkout: err instanceof Error ? err.message : 'Failed to place order'
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, checkout: false }));
    }
  };

  // Add new address
  const handleAddAddress = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newAddress),
      });

      if (!response.ok) throw new Error('Failed to add address');

      const addedAddress = await response.json();
      setAddresses(prev => [...prev, addedAddress]);
      setSelectedAddressId(addedAddress.address_id);
      setShowAddressForm(false);
      setNewAddress({
        name: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Philippines",
        phone: "",
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add address');
    }
  };

  // Loading states
  if (isLoading.watches && activeTab === "store") {
    return <div className="user-store-container loading">Loading watches...</div>;
  }

  if (isLoading.orders && activeTab === "orders") {
    return <div className="user-store-container loading">Loading orders...</div>;
  }

  return (
    <div className="user-store-container">
      {/* Store Header */}
      <header className="store-header">
        <h1>Watch Store</h1>
        <p>Let your watch tell your story of success.</p>
        <div className="tabs">
          <button 
            className={activeTab === "store" ? "active" : ""}
            onClick={() => setActiveTab("store")}
          >
            <span>Store</span>
          </button>
          <button 
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            <span>My Orders</span>
          </button>
          <button 
            className={activeTab === "cart" ? "active" : ""}
            onClick={() => setActiveTab("cart")}
          >
            <ShoppingCart size={16} />
            {cart.length > 0 && (
              <span className="cart-badge">{cart.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* Filters Section */}
      <div className="filters">
        <div className="search-bar">
          <div className="search-icon-container">
            <Search className="search-icon" />
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search watches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="price-filter">
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="SelectTrigger">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent className="SelectContent">
              <SelectItem className="SelectItem" value="all">All Prices</SelectItem>
              <SelectItem className="SelectItem" value="under500">Under $500</SelectItem>
              <SelectItem className="SelectItem" value="500to1000">$500 - $1000</SelectItem>
              <SelectItem className="SelectItem" value="over1000">Over $1000</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notification */}
      {addedToCartNotification.show && (
        <div className="add-to-cart-feedback">
          <Check size={16} />
          <span>Added {addedToCartNotification.watchName} to cart</span>
        </div>
      )}

      {/* Main Content */}
      {activeTab === "store" && (
        <div className="watch-grid">
          {filteredWatches.length > 0 ? (
            filteredWatches.map((watch) => (
              <div key={watch.product_id} className="watch-card">
                <div className="watch-image-container">
                  <img
                    src={watch.primary_image}
                    alt={watch.name}
                    className="watch-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/watch-placeholder.jpg";
                    }}
                  />
                  {watch.stock_quantity <= 0 && (
                    <div className="out-of-stock-badge">Out of Stock</div>
                  )}
                </div>
                <div className="watch-content">
                  <h3 className="watch-title">{watch.name}</h3>
                  <p className="watch-description">
                    {watch.description || "No description available"}
                  </p>
                  <div className="watch-meta">
                    <span className="watch-price">${watch.price.toFixed(2)}</span>
                    <span className="watch-category">{watch.category_id}</span>
                  </div>
                  <div className="watch-actions">
                    <button
                      className="add-to-cart-btn"
                      onClick={() => addToCart(watch)}
                      disabled={watch.stock_quantity <= 0}
                    >
                      {watch.stock_quantity <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                    <button
                      className="buy-now-btn"
                      disabled={watch.stock_quantity <= 0}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No watches found matching your criteria</p>
              <button className="shop-now-btn" onClick={() => {
                setSearchTerm("");
                setPriceFilter("all");
              }}>
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cart Tab */}
      {activeTab === "cart" && (
        <div className="cart-content">
          <div className="cart-header">
            <button className="back-btn" onClick={() => setActiveTab("store")}>
              <ChevronLeft size={16} />
              <span>Continue Shopping</span>
            </button>
            <h2>Your Cart</h2>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={48} />
              <p>Your cart is empty</p>
              <button 
                className="continue-shopping-btn"
                onClick={() => setActiveTab("store")}
              >
                Browse Watches
              </button>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items-section">
                {cart.map((item) => (
                  <div key={item.product_id} className="cart-item">
                    <input 
                      type="checkbox" 
                      className="cart-checkbox"
                      checked
                      onChange={() => {}}
                    />
                    <div className="cart-item-image-container">
                      <img
                        src={item.primary_image}
                        alt={item.name}
                        className="cart-item-image"
                      />
                    </div>
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <p className="cart-item-price">${item.price.toFixed(2)}</p>
                      <div className="cart-item-actions">
                        <div className="quantity-controls">
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button 
                          className="remove-btn"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary-section">
                <div className="order-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <button 
                    className="checkout-btn"
                    onClick={() => setShowCheckout(true)}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="orders-content">
          <div className="orders-header">
            <h2>Your Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="empty-orders">
              <WalletCards size={48} />
              <p>You haven't placed any orders yet</p>
              <button 
                className="shop-now-btn"
                onClick={() => setActiveTab("store")}
              >
                Browse Watches
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.order_id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <span className="order-id">Order #{order.order_number}</span>
                      <span className="order-date">
                        {new Date(order.order_date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`order-status ${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="order-items">
                    {order.items.slice(0, 2).map((item) => (
                      <div key={item.product_id} className="order-item">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="order-item-image"
                        />
                        <div className="order-item-details">
                          <h4>{item.name}</h4>
                          <p>
                            {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="more-items">
                        +{order.items.length - 2} more items
                      </div>
                    )}
                  </div>
                  
                  <div className="order-footer">
                    <div className="order-total">
                      <span>Total:</span>
                      <span>${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="order-actions">
                      <button className="cancel-btn">
                        Cancel Order
                      </button>
                      <div className="tracking-info">
                        <span>Tracking #123456</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="checkout-modal">
          <div className="checkout-overlay" onClick={() => setShowCheckout(false)} />
          <div className="checkout-content">
            <div className="checkout-header">
              <h2>Checkout</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCheckout(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="checkout-body">
              <div className="delivery-section">
                <h3>
                  <MapPin size={18} />
                  <span>Delivery Information</span>
                </h3>
                
                {error.checkout && (
                  <div className="error-message">{error.checkout}</div>
                )}
                
                {/* Address selection form */}
                {!showAddressForm ? (
                  <>
                    <div className="form-group">
                      <Label>Select Address</Label>
                      <Select
                        value={selectedAddressId}
                        onValueChange={setSelectedAddressId}
                      >
                        <SelectTrigger className="SelectTrigger">
                          <SelectValue placeholder="Select an address" />
                        </SelectTrigger>
                        <SelectContent className="SelectContent">
                          {addresses.map((address) => (
                            <SelectItem 
                              key={address.address_id} 
                              value={address.address_id}
                              className="SelectItem"
                            >
                              {address.name}, {address.line1}, {address.city}
                              {address.is_default && " (Default)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button 
                      className="add-address-btn"
                      onClick={() => setShowAddressForm(true)}
                    >
                      <Plus size={16} /> Add New Address
                    </button>
                  </>
                ) : (
                  <div className="address-form">
                    <div className="form-group">
                      <Label>Full Name</Label>
                      <Input
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                      />
                    </div>
                    {/* More address form fields */}
                    <div className="form-actions">
                      <button
                        className="cancel-btn"
                        onClick={() => setShowAddressForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="save-btn"
                        onClick={handleAddAddress}
                      >
                        Save Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="order-summary-section">
                <h3>Order Summary</h3>
                {cart.map((item) => (
                  <div key={item.product_id} className="checkout-item">
                    <img
                      src={item.primary_image}
                      alt={item.name}
                      className="checkout-item-image"
                    />
                    <div className="checkout-item-details">
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity}</p>
                    </div>
                    <div className="checkout-item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="checkout-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="checkout-footer">
              <button
                className="back-btn"
                onClick={() => setShowCheckout(false)}
              >
                Back
              </button>
              <button
                className="place-order-btn"
                onClick={handleCheckout}
                disabled={isLoading.checkout}
              >
                {isLoading.checkout ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStore;