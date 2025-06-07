// src/components/ProductList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { getProducts } from './productService';
import { CartContext } from './CartContext'; // Asumo que es './cartContext.jsx' si CartContext está en un archivo diferente. Revisa tu import.

export default function ProductList() {
  const [allProducts, setAllProducts] = useState([]); // Estado inicial como array vacío
  const [filteredAndCategorizedProducts, setFilteredAndCategorizedProducts] = useState([]);
  const { cartItems, addToCart, removeFromCart } = useContext(CartContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true); // Empezar cargando
  const [error, setError] = useState('');

  const categories = { /* ... Tu definición de categorías ... */
     'Todas': { start: 0, end: Infinity }, 
     'DULCE DE LECHE': { start: 1, end: 22 },
     'SALSAS': { start: 23, end: 25 },
     'FIAMBRES': { start: 26, end: 114 },
     'QUESOS': { start: 83, end: 97 },
     'HARINAS': { start: 98, end: 100 },
     'LECHES': { start: 101, end: 115 },
     'VINOS': { start: 102, end: 102 },
     'FRUTOS': { start: 103, end: 108 },
     'ACEITES': { start: 116, end: 119 },
     'VINAGRES': { start: 34, end: 44 },
     'VARIEGATOS HELADERIA / REPOSTERIA': { start: 45, end: 66 },
     'CONGELADOS': { start: 120, end: 145 },
     'CACAO/CHOCOLATE': { start: 146, end: 150 }
  };

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      setError('');
      try {
        const fetchedProducts = await getProducts();
        console.log("ProductList: Productos obtenidos en useEffect:", fetchedProducts); // Para depurar qué llega
        
        // MUY IMPORTANTE: Verificar si fetchedProducts es un array
        if (Array.isArray(fetchedProducts)) {
          setAllProducts(fetchedProducts);
        } else {
          // Si getProducts devuelve algo que no es un array (ej. undefined por un error no capturado, o un objeto de error)
          console.error("ProductList: getProducts no devolvió un array. Recibido:", fetchedProducts);
          setAllProducts([]); // Establecer a array vacío para evitar errores de .filter
          setError('Error: No se pudo obtener una lista válida de productos del servidor.');
        }
      } catch (err) { // Este catch es por si getProducts relanza un error
        setError(`Error al cargar productos: ${err.message}`);
        setAllProducts([]); // Asegurar que sea un array vacío
        console.error("ProductList: Catch en loadProducts:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
     // Este efecto se ejecuta cuando allProducts, searchTerm, o selectedCategory cambian.
     // Asegurarse de que allProducts es un array antes de filtrar.
     if (!Array.isArray(allProducts)) {
         // Esto no debería pasar si el useEffect anterior y getProducts manejan bien los errores,
         // pero es una salvaguarda.
         console.warn("ProductList: allProducts no es un array en el efecto de filtrado. Valor:", allProducts);
         setFilteredAndCategorizedProducts([]);
         return; 
     }

     let currentFiltered = allProducts;

     if (searchTerm) {
         currentFiltered = currentFiltered.filter(product =>
             product.nombre && typeof product.nombre === 'string' && // Chequeo extra
             product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
         );
     }

     if (selectedCategory !== 'Todas' && categories[selectedCategory]) {
         const { start, end } = categories[selectedCategory];
         currentFiltered = currentFiltered.filter(product =>
             product.id >= start && product.id <= end
         );
     }
     
     setFilteredAndCategorizedProducts(currentFiltered);
     setCurrentPage(1);

  }, [allProducts, searchTerm, selectedCategory, categories]); // categories añadido si su estructura puede cambiar


  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProductsOnPage = filteredAndCategorizedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredAndCategorizedProducts.length / productsPerPage);

  const paginate = (pageNumber) => {
     if (pageNumber >= 1 && pageNumber <= totalPages) {
         setCurrentPage(pageNumber);
     }
  };
  
  const handleProductsPerPageChange = (e) => {
    setProductsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // setCurrentPage(1) ya se maneja en el useEffect de filtrado
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    // setCurrentPage(1) ya se maneja en el useEffect de filtrado
  };

  const getQuantity = (productId) => {
    const item = cartItems.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };
  
  if (isLoading) {
     return <div className="product-list-container"><p>Cargando productos...</p></div>;
  }

  if (error) { // Mostrar error si existe
     return <div className="product-list-container"><p className="error-message global-error">{error}</p></div>;
  }

  return (
    <div className="product-list-container">
      <h2>Lista de Productos</h2>
      <div className="filters-container">
        <div className="category-select-container">
          <label htmlFor="category-select">Categoría:</label>
          <select id="category-select" value={selectedCategory} onChange={handleCategoryChange} className="category-select">
            {Object.keys(categories).map(categoryName => (
              <option key={categoryName} value={categoryName}>{categoryName}</option>
            ))}
          </select>
        </div>
        <div className="search-bar-container">
          <input type="text" placeholder="Buscar productos por nombre..." value={searchTerm} onChange={handleSearchChange} className="search-input"/>
        </div>
      </div>
      <div className="pagination-controls-top">
        <label>
          Ver:
          <select value={productsPerPage} onChange={handleProductsPerPageChange}>
            <option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option>
            <option value={allProducts.length > 0 ? allProducts.length : 100}>Todos</option> 
          </select>
        </label>
      </div>

      {currentProductsOnPage.length === 0 ? (
        <p className="no-products-message">No se encontraron productos para los filtros seleccionados.</p>
      ) : (
        <div className="products-grid">
          {currentProductsOnPage.map((p) => (
            <div className="product-item" key={p.id}>
              <div className="product-info">
                <span className="product-code">Cod.{p.id}</span>
                <strong className="product-name">{p.nombre}</strong>
                {/* Mostrar stock si está disponible en el objeto 'p' */}
                {p.stock !== undefined && <span className="cart-item-stock-indicator">(Disponible: {p.stock})</span>}
              </div>
              <span className="product-price">${p.precio ? p.precio.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'} ({p.unidad})</span>
              <div className="product-controls">
                <button onClick={() => removeFromCart(p.id)} disabled={getQuantity(p.id) === 0}>-</button>
                <span>{getQuantity(p.id)}</span>
                {/* Deshabilitar botón de añadir si no hay stock (p.stock === 0) o si la cantidad en carrito iguala el stock */}
                <button onClick={() => addToCart(p)} disabled={p.stock !== undefined && (p.stock === 0 || getQuantity(p.id) >= p.stock)}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredAndCategorizedProducts.length > productsPerPage && (
        <div className="pagination">
          <button onClick={() => paginate(1)} disabled={currentPage === 1}>&laquo;</button>
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>&lsaquo;</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
             (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)) ? (
                 <button key={pageNumber} onClick={() => paginate(pageNumber)} className={currentPage === pageNumber ? 'active' : ''}>{pageNumber}</button>
             ) : (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) ? <span key={pageNumber}>...</span> : null
          ))}
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>&rsaquo;</button>
          <button onClick={() => paginate(totalPages)} disabled={currentPage === totalPages}>&raquo;</button>
          <div className="page-info">
            <span>Pág. {currentPage} de {totalPages}</span>
            <span>[{Math.min(indexOfFirstProduct + 1, filteredAndCategorizedProducts.length)} a {Math.min(indexOfLastProduct, filteredAndCategorizedProducts.length)} de {filteredAndCategorizedProducts.length}]</span>
          </div>
        </div>
      )}
    </div>
  );
}