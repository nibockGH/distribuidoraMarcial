import React, { useState, useEffect, useContext } from 'react';
import { getProducts } from './productService';
import { CartContext } from './CartContext';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const { cartItems, addToCart, removeFromCart } = useContext(CartContext);

  const [searchTerm, setSearchTerm] = useState('');
  // --- NUEVO ESTADO PARA LA CATEGORÍA SELECCIONADA ---
  const [selectedCategory, setSelectedCategory] = useState('Todas'); // 'Todas' para mostrar todos los productos

  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);

  // Definición de las categorías y sus rangos de IDs
  const categories = {
    'Todas': { start: 0, end: 9999 }, // Una categoría "Todas" para ver todo
    'DULCE DE LECHE': { start: 1, end: 22 },
    'SALSAS': { start: 23, end: 25 },
    'FIAMBRES': { start: 26, end: 114 }, // Incluye Weber, Bosio y Tacural
    'QUESOS': { start: 83, end: 97 },
    'HARINAS': { start: 98, end: 100 },
    'LECHES': { start: 101, end: 115 },
    'VINOS': { start: 102, end: 102 }, // Solo el ID 102
    'FRUTOS': { start: 103, end: 108 },
    'ACEITES': { start: 116, end: 119 },
    'VINAGRES': { start: 34, end: 44 }, // IDs superpuestos con Fiambreria (importante para tu data)
    'VARIEGATOS HELADERIA / REPOSTERIA': { start: 45, end: 66 },
    'CONGELADOS': { start: 120, end: 145 },
    'CACAO/CHOCOLATE': { start: 146, end: 150 }
  };

  useEffect(() => {
    const fetchedProducts = getProducts();
    console.log("ProductList: Productos obtenidos:", fetchedProducts);
    setProducts(fetchedProducts);
  }, []);

  // Función para obtener la categoría de un producto por su ID
  const getCategoryByProductId = (productId) => {
    for (const categoryName in categories) {
      if (categoryName === 'Todas') continue; // Ignoramos la categoría "Todas" para asignación individual
      const { start, end } = categories[categoryName];
      if (productId >= start && productId <= end) {
        return categoryName;
      }
    }
    return 'Otros'; // Categoría por defecto si no coincide
  };

  // --- Lógica de Filtrado (ahora considera la categoría seleccionada) ---
  const filteredAndCategorizedProducts = products.filter(product => {
    // 1. Filtrar por término de búsqueda
    const matchesSearchTerm = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filtrar por categoría seleccionada
    let matchesCategory = false;
    if (selectedCategory === 'Todas') {
      matchesCategory = true; // Si 'Todas' está seleccionada, no filtramos por categoría
    } else {
      const { start, end } = categories[selectedCategory];
      if (product.id >= start && product.id <= end) {
        matchesCategory = true;
      }
    }

    return matchesSearchTerm && matchesCategory;
  });

  // Obtener productos para la página actual (ahora de filteredAndCategorizedProducts)
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredAndCategorizedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Calcular número total de páginas (ahora basado en filteredAndCategorizedProducts)
  const totalPages = Math.ceil(filteredAndCategorizedProducts.length / productsPerPage);

  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Cambiar productos por página
  const handleProductsPerPageChange = (e) => {
    setProductsPerPage(Number(e.target.value));
    setCurrentPage(1); // Volver a la primera página cuando cambias el tamaño
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  // --- NUEVA FUNCIÓN PARA CAMBIAR LA CATEGORÍA SELECCIONADA ---
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSearchTerm(''); // Limpiar búsqueda al cambiar de categoría (opcional, pero suele ser útil)
    setCurrentPage(1); // Resetear a la primera página al cambiar la categoría
  };

  const getQuantity = (productId) => {
    const item = cartItems.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="product-list-container">
      <h2>Lista de Productos</h2>

      {/* --- SELECTOR DE CATEGORÍAS Y BARRA DE BÚSQUEDA --- */}
      <div className="filters-container">
        <div className="category-select-container">
          <label htmlFor="category-select">Categoría:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="category-select"
          >
            {Object.keys(categories).map(categoryName => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>
        </div>

        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Buscar productos por nombre..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>


      {/* Controles de paginación superior */}
      <div className="pagination-controls-top">
        <label>
          Ver:
          <select value={productsPerPage} onChange={handleProductsPerPageChange}>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </div>

      {currentProducts.length === 0 && (searchTerm !== '' || selectedCategory !== 'Todas') ? (
        <p className="no-products-message">
          No se encontraron productos para "{searchTerm}" en la categoría "{selectedCategory}".
        </p>
      ) : currentProducts.length === 0 ? (
        <p className="no-products-message">No hay productos para mostrar.</p>
      ) : (
        <div className="products-grid">
          {currentProducts.map((p) => {
            return (
              <div className="product-item" key={p.id}>
                <div className="product-info">
                  <span className="product-code">Cod.{p.id}</span>
                  <strong className="product-name">{p.nombre}</strong>
                </div>
                <span className="product-price">${p.precio.toLocaleString('es-AR')}</span>
                <div className="product-controls">
                  <button onClick={() => removeFromCart(p.id)} disabled={getQuantity(p.id) === 0}>-</button>
                  <span>{getQuantity(p.id)}</span>
                  <button onClick={() => addToCart(p)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Controles de paginación inferior */}
      {filteredAndCategorizedProducts.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => paginate(1)}
            disabled={currentPage === 1}
          >
            &laquo;
          </button>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lsaquo;
          </button>

          {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => paginate(pageNumber)}
              className={currentPage === pageNumber ? 'active' : ''}
            >
              {pageNumber}
            </button>
          ))}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &rsaquo;
          </button>
          <button
            onClick={() => paginate(totalPages)}
            disabled={currentPage === totalPages}
          >
            &raquo;
          </button>
          <div className="page-info">
            <span>Pág. {currentPage} de {totalPages}</span>
            <span>[{indexOfFirstProduct + 1} a {Math.min(indexOfLastProduct, filteredAndCategorizedProducts.length)} de {filteredAndCategorizedProducts.length}]</span>
          </div>
        </div>
      )}
    </div>
  );
}