import React, { useState, useMemo } from "react";
import { Edit, Plus, Search, Trash2, Filter, ArrowUpDown } from "lucide-react";
import "./product.css";

type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";
type ProductCategory = "luxury" | "sports" | "classic" | "smart" | "fashion";

interface Product {
  product_id: string;
  name: string;
  price: number;
  category_id: ProductCategory;
  stock_quantity: number;
  status: ProductStatus;
  created_at: string;
  description?: string;
  images?: string[];
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onAdd?: () => void;
}

const ProductTable = ({
  products = [],
  onEdit = () => {},
  onDelete = () => {},
  onAdd = () => {},
}: ProductTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: Exclude<keyof Product, 'description' | 'images'>;
    direction: 'ascending' | 'descending';
  } | null>(null);

  const processedProducts = useMemo(() => {
    let filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'created_at') {
          const aDate = new Date(aValue).getTime();
          const bDate = new Date(bValue).getTime();
          return sortConfig.direction === 'ascending' ? aDate - bDate : bDate - aDate;
        }

        if (sortConfig.key === 'price') {
          return sortConfig.direction === 'ascending' 
            ? a.price - b.price
            : b.price - a.price;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return 0;
      });
    }

    return filtered;
  }, [products, searchTerm, sortConfig]);

  const requestSort = (key: Exclude<keyof Product, 'description' | 'images'>) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedProducts(checked ? processedProducts.map(p => p.product_id) : []);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev => 
      checked ? [...prev, productId] : prev.filter(id => id !== productId));
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "In Stock": return "badge badge-green";
      case "Low Stock": return "badge badge-yellow";
      case "Out of Stock": return "badge badge-red";
      default: return "badge";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="card">
      <div className="table-header">
        <h2 className="table-title">Watches</h2>
        <button
          className="add-button"
          onClick={onAdd}
          aria-label="Add new watch"
        >
          <Plus size={18} />
          <span>Add Watch</span>
        </button>
      </div>

      <div className="table-controls">
        <div className="search-container">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search watches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search watches"
          />
        </div>

        <div className="filter-controls">
          <button className="filter-button" aria-label="Filter watches">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  className="select-all-checkbox"
                  checked={selectedProducts.length === processedProducts.length && processedProducts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all watches"
                />
              </th>
              <th 
                className="sortable-header" 
                onClick={() => requestSort('name')}
              >
                <div className="header-content">
                  Name
                  {sortConfig?.key === 'name' && <ArrowUpDown size={14} className="sort-icon" />}
                </div>
              </th>
              <th 
                className="sortable-header" 
                onClick={() => requestSort('category_id')}
              >
                <div className="header-content">
                  Category
                  {sortConfig?.key === 'category_id' && <ArrowUpDown size={14} className="sort-icon" />}
                </div>
              </th>
              <th 
                className="sortable-header" 
                onClick={() => requestSort('price')}
              >
                <div className="header-content">
                  Price
                  {sortConfig?.key === 'price' && <ArrowUpDown size={14} className="sort-icon" />}
                </div>
              </th>
              <th 
                className="sortable-header" 
                onClick={() => requestSort('status')}
              >
                <div className="header-content">
                  Status
                  {sortConfig?.key === 'status' && <ArrowUpDown size={14} className="sort-icon" />}
                </div>
              </th>
              <th 
                className="sortable-header" 
                onClick={() => requestSort('created_at')}
              >
                <div className="header-content">
                  Created
                  {sortConfig?.key === 'created_at' && <ArrowUpDown size={14} className="sort-icon" />}
                </div>
              </th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedProducts.length > 0 ? (
              processedProducts.map((product) => (
                <tr key={product.product_id}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      className="row-checkbox"
                      checked={selectedProducts.includes(product.product_id)}
                      onChange={(e) => handleSelectProduct(product.product_id, e.target.checked)}
                      aria-label={`Select ${product.name}`}
                    />
                  </td>
                  <td className="product-name"><strong>{product.name}</strong></td>
                  <td className="product-category">{product.category_id}</td>
                  <td className="product-price">${product.price.toFixed(2)}</td>
                  <td className="product-status">
                    <span className={getStatusClass(product.status)}>
                      {product.status}
                    </span>
                  </td>
                  <td className="product-date">{formatDate(product.created_at)}</td>
                  <td className="product-actions">
                    <div className="action-buttons">
                      <button
                        className="edit-button"
                        onClick={() => onEdit(product)}
                        aria-label={`Edit ${product.name}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => onDelete(product.product_id)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="empty-table-message">
                  No watches found. Try adjusting your search or add a new watch.
                </td>
              </tr>
            )}
          </tbody>
          <caption className="table-caption">
            Showing {processedProducts.length} of {products.length} watches
          </caption>
        </table>
      </div>

      {selectedProducts.length > 0 && (
        <div className="selection-actions">
          <div className="selection-count">
            {selectedProducts.length} watch{selectedProducts.length !== 1 ? 'es' : ''} selected
          </div>
          <div className="selection-buttons">
            <button className="deselect-button" onClick={() => setSelectedProducts([])}>
              Deselect All
            </button>
            <button
              className="delete-selected-button"
              onClick={() => {
                selectedProducts.forEach(onDelete);
                setSelectedProducts([]);
              }}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;