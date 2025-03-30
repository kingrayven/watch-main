import React, { useState, useEffect, useMemo } from "react";
import { AlertCircle, BarChart2, Package } from "lucide-react";
import axios from "axios";
import ProductTable from "./ProductTable";
import ProductForm from "./ProductForm";
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

interface ProductManagementProps {
  initialProducts?: Product[];
}

const ProductManagement = ({ initialProducts = [] }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/products", {
          withCredentials: true
        });
        const productsWithStatus = response.data.map((product: any) => ({
          ...product,
          product_id: product.product_id.toString(),
          status: getStockStatus(product.stock_quantity),
          category_id: product.category_id || "luxury",
          images: product.images ? 
            (Array.isArray(product.images) ? product.images : [product.images]) : []
        }));
        setProducts(productsWithStatus);
      } catch (err) {
        const errorMessage = axios.isAxiosError(err) 
          ? err.response?.data?.message || "Failed to fetch products"
          : "Failed to fetch products";
        setError(errorMessage);
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getStockStatus = (quantity: number): ProductStatus => {
    if (quantity <= 0) return "Out of Stock";
    if (quantity <= 5) return "Low Stock";
    return "In Stock";
  };

  const productStats = useMemo(() => {
    return products.reduce(
      (stats, product) => {
        stats.total++;
        if (product.status === "In Stock") stats.inStock++;
        if (product.status === "Low Stock") stats.lowStock++;
        if (product.status === "Out of Stock") stats.outOfStock++;
        return stats;
      },
      { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 }
    );
  }, [products]);

  const analyticsData = useMemo(() => {
    if (products.length === 0) return null;
    
    const mostExpensive = products.reduce((max, p) => 
      p.price > max.price ? p : max, products[0]);
    const averagePrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    const categories = [...new Set(products.map(p => p.category_id))];
    
    return {
      mostExpensive,
      averagePrice,
      categories
    };
  }, [products]);

  const handleAddProduct = async (formData: any) => {
    try {
      setIsLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append("category_id", formData.category);
      formDataToSend.append("stock_quantity", formData.isAvailable ? "10" : "0");

      if (Array.isArray(formData.images)) {
        formData.images.forEach((image: File) => {
          formDataToSend.append("profileImage", image);
        });
      }

      const response = await axios.post("http://localhost:5000/api/products", formDataToSend, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newProduct = {
        ...response.data,
        product_id: response.data.product_id.toString(),
        status: getStockStatus(formData.isAvailable ? 10 : 0),
        images: formData.images?.map((img: File) => URL.createObjectURL(img)) || []
      };

      setProducts([...products, newProduct]);
      setIsAddProductOpen(false);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to add product"
        : "Failed to add product";
      setError(errorMessage);
      console.error("Error adding product:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditProductOpen(true);
  };

  const handleUpdateProduct = async (formData: any) => {
    if (!selectedProduct) return;
    
    try {
      setIsLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append("category_id", formData.category);
      formDataToSend.append("stock_quantity", formData.isAvailable ? "10" : "0");

      if (Array.isArray(formData.images)) {
        formData.images.forEach((image: File) => {
          if (image instanceof File) {
            formDataToSend.append("profileImage", image);
          }
        });
      }

      await axios.put(
        `http://localhost:5000/api/products/${selectedProduct.product_id}`,
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedProducts = products.map(p => 
        p.product_id === selectedProduct.product_id
          ? { 
              ...p, 
              name: formData.name,
              description: formData.description,
              price: formData.price,
              category_id: formData.category,
              stock_quantity: formData.isAvailable ? 10 : 0,
              status: getStockStatus(formData.isAvailable ? 10 : 0),
              images: formData.images?.map((img: File) => 
                img instanceof File ? URL.createObjectURL(img) : img
              ) || []
            } 
          : p
      );
      
      setProducts(updatedProducts);
      setIsEditProductOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to update product"
        : "Failed to update product";
      setError(errorMessage);
      console.error("Error updating product:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        withCredentials: true
      });
      setProducts(products.filter(p => p.product_id !== productId));
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to delete product"
        : "Failed to delete product";
      setError(errorMessage);
      console.error("Error deleting product:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      switch (activeTab) {
        case "in-stock": return product.status === "In Stock";
        case "low-stock": return product.status === "Low Stock";
        case "out-of-stock": return product.status === "Out of Stock";
        default: return true;
      }
    });
  }, [products, activeTab]);

  const handleCloseModal = () => {
    setIsAddProductOpen(false);
    setIsEditProductOpen(false);
    setSelectedProduct(null);
  };

  if (isLoading) {
    return <div className="container">Loading products...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  return (
    <div className="container">
      <div className="product-management-header">
        <h1>
          <Package className="icon" />
          Product Management
        </h1>
        <div className="header-actions">
          <button
            className={`alert-button ${showAlerts ? "active" : ""}`}
            onClick={() => setShowAlerts(!showAlerts)}
          >
            <AlertCircle />
            {productStats.lowStock + productStats.outOfStock > 0 && (
              <span className="alert-badge">
                {productStats.lowStock + productStats.outOfStock}
              </span>
            )}
          </button>
          <button
            className={`analytics-button ${showAnalytics ? "active" : ""}`}
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart2 />
          </button>
          <button
            className="add-product-button"
            onClick={() => setIsAddProductOpen(true)}
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="product-tabs">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All ({productStats.total})
        </button>
        <button
          className={activeTab === "in-stock" ? "active" : ""}
          onClick={() => setActiveTab("in-stock")}
        >
          In Stock ({productStats.inStock})
        </button>
        <button
          className={activeTab === "low-stock" ? "active" : ""}
          onClick={() => setActiveTab("low-stock")}
        >
          Low Stock ({productStats.lowStock})
        </button>
        <button
          className={activeTab === "out-of-stock" ? "active" : ""}
          onClick={() => setActiveTab("out-of-stock")}
        >
          Out of Stock ({productStats.outOfStock})
        </button>
      </div>

      {showAlerts && (
        <div className="alerts-panel">
          <h3>Stock Alerts</h3>
          {productStats.lowStock === 0 && productStats.outOfStock === 0 ? (
            <p>No stock alerts</p>
          ) : (
            <ul>
              {productStats.lowStock > 0 && (
                <li className="low-stock-alert">
                  {productStats.lowStock} product(s) with low stock
                </li>
              )}
              {productStats.outOfStock > 0 && (
                <li className="out-of-stock-alert">
                  {productStats.outOfStock} product(s) out of stock
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {showAnalytics && analyticsData && (
        <div className="analytics-panel">
          <h3>Product Analytics</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Most Expensive</h4>
              <p>{analyticsData.mostExpensive.name}</p>
              <p className="price">₱{analyticsData.mostExpensive.price.toFixed(2)}</p>
            </div>
            <div className="analytics-card">
              <h4>Average Price</h4>
              <p className="price">₱{analyticsData.averagePrice.toFixed(2)}</p>
            </div>
            <div className="analytics-card">
              <h4>Categories</h4>
              <ul>
                {analyticsData.categories.map(category => (
                  <li key={category}>{category}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <ProductTable
        products={filteredProducts}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />

      {isAddProductOpen && (
        <ProductForm
          onSubmit={handleAddProduct}
          onCancel={handleCloseModal}
          isEditing={false}
        />
      )}

      {isEditProductOpen && selectedProduct && (
        <ProductForm
          product={selectedProduct}
          onSubmit={handleUpdateProduct}
          onCancel={handleCloseModal}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default ProductManagement;