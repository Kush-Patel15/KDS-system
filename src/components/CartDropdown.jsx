import { useRef, useEffect, useState } from "react";

const CartDropdown = ({ cart, setShowCart, confirmOrder, removeFromCart, addToCart }) => {
  const cartRef = useRef();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    orderType: 'pickup'
  });
  const [loading, setLoading] = useState(false);

  // Close cart on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setShowCart(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowCart]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      await confirmOrder(customerInfo);
      setCustomerInfo({ name: '', phone: '', orderType: 'pickup' });
    } catch (error) {
      console.error('Order failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={cartRef} className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">Your Cart 🛒</h2>
          <button
            onClick={() => setShowCart(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold dark:text-white text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">${item.price} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center dark:text-white font-medium">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between text-lg font-bold dark:text-white">
                <span>Total: ${total.toFixed(2)}</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 dark:text-white flex items-center">
                  👤 Customer Information
                </h3>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  className="w-full p-3 border rounded-lg mt-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2 dark:text-white flex items-center">
                  🚀 Order Type
                </h3>
                <div className="flex space-x-4">
                  <label className="flex items-center dark:text-white cursor-pointer">
                    <input
                      type="radio"
                      value="pickup"
                      checked={customerInfo.orderType === 'pickup'}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, orderType: e.target.value }))}
                      className="mr-2 text-orange-500 focus:ring-orange-500"
                    />
                    🕒 Pickup from Kitchen
                  </label>
                  <label className="flex items-center dark:text-white cursor-pointer">
                    <input
                      type="radio"
                      value="delivery"
                      checked={customerInfo.orderType === 'delivery'}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, orderType: e.target.value }))}
                      className="mr-2 text-orange-500 focus:ring-orange-500"
                    />
                    ⚡ Delivery
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-bold hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
              >
                {loading ? 'Placing Order...' : `Place Order 🚀`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDropdown;
