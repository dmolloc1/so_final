import React, { useState } from 'react';
import { Minus, Plus, Trash2, Percent } from 'lucide-react';
import type { CartItem } from '../../../../types/sale';

interface ProductCartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onUpdateDiscount?: (productId: number, newDiscount: number) => void;
  onRemoveItem: (productId: number) => void;
}

const ProductCart: React.FC<ProductCartProps> = ({
  cart,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem
}) => {
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null);
  const [tempDiscount, setTempDiscount] = useState<string>('');

  const handleQuantityChange = (item: CartItem, change: number) => {
    const newQuantity = item.quantity + change;
    const maxStock = getAvailableStock(item.product);
    
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      onUpdateQuantity(item.product.prodCod, newQuantity);
    }
  };
  
  const getAvailableStock = (product: any) => {
    return (
      product.stock_disponible ||       
      product.total_stock_central ||  
      0                              
    );
  };

  const handleDiscountClick = (item: CartItem) => {
    setEditingDiscount(item.product.prodCod);
    setTempDiscount(item.discount.toString());
  };

  const handleDiscountChange = (value: string) => {
    // Solo permitir números y un punto decimal
    if (/^\d*\.?\d*$/.test(value)) {
      setTempDiscount(value);
    }
  };

  const handleDiscountSave = (productId: number) => {
    if (!onUpdateDiscount) return;
    
    const discount = parseFloat(tempDiscount) || 0;
    const validDiscount = Math.max(0, Math.min(100, discount));
    
    onUpdateDiscount(productId, validDiscount);
    setEditingDiscount(null);
    setTempDiscount('');
  };

  const handleDiscountCancel = () => {
    setEditingDiscount(null);
    setTempDiscount('');
  };

  if (cart.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6 py-8">
        <div className="text-center text-gray-500">
          <div className="w-30 h-30 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-6xl">🛒</span>
          </div>
          <p className="font-medium text-gray-600 text-xl">Carrito vacío</p>
          <p className="text-sm mt-1 text-gray-500">Agrega productos para continuar</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Header compacto */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-lg">Productos seleccionados</h2>
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-sm">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Lista de productos compacta */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="space-y-3">
          {cart.map((item) => (
            <div 
              key={item.product.prodCod} 
              className="group flex items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              
              {/* Información principal compacta */}
              <div className="flex-1 min-w-0 mr-4 p-2">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight truncate flex-1">
                    {item.product.prodDescr}
                  </h3>
                  {item.discount > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                      -{item.discount}%
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mb-2">
                  <span className="font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-md text-sm">
                    {item.product.prodMarca}
                  </span>
                  {item.product.prodBarcode && (
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      Código: {item.product.prodBarcode}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-blue-600 text-lg">
                    S/ {Number(item.product.prodValorUni).toFixed(2)} c/u
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    + IGV: S/ {(Number(item.product.precioVentaConIGV) - Number(item.product.prodValorUni)).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    Stock: {getAvailableStock(item.product)}
                  </span>

                  {/* Botón de descuento */}
                  {onUpdateDiscount && editingDiscount !== item.product.prodCod && (
                    <button
                      onClick={() => handleDiscountClick(item)}
                      className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
                      title="Aplicar descuento"
                    >
                      <Percent className="w-3 h-3" />
                      {item.discount > 0 ? `${item.discount}%` : 'Descuento'}
                    </button>
                  )}

                  {/* Editor de descuento */}
                  {onUpdateDiscount && editingDiscount === item.product.prodCod && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempDiscount}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleDiscountSave(item.product.prodCod);
                          if (e.key === 'Escape') handleDiscountCancel();
                        }}
                        className="w-16 px-2 py-1 text-xs border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="0-100"
                        autoFocus
                      />
                      <span className="text-xs text-gray-500">%</span>
                      <button
                        onClick={() => handleDiscountSave(item.product.prodCod)}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleDiscountCancel}
                        className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Controles compactos */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Controles de cantidad */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-300">
                    <button 
                      onClick={() => handleQuantityChange(item, -1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${
                        item.quantity <= 1 
                          ? 'bg-gray-300 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 hover:bg-red-500 hover:text-white shadow-sm'
                      }`}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    
                    <span className="w-10 text-center font-bold text-gray-900 text-sm bg-white py-1 rounded mx-1 border border-gray-200">
                      {item.quantity}
                    </span>
                    
                    <button 
                      onClick={() => handleQuantityChange(item, 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${
                        item.quantity >= getAvailableStock(item.product)
                          ? 'bg-gray-300 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 hover:bg-green-500 hover:text-white shadow-sm'
                      }`}
                      disabled={item.quantity >= getAvailableStock(item.product)}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Total y eliminar */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <span className="font-bold text-gray-900 text-lg block">
                      S/ {item.total.toFixed(2)}
                    </span>
                    {item.discount > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        S/ {(item.subtotal * (1 + 0.18)).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => onRemoveItem(item.product.prodCod)}
                    className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCart;