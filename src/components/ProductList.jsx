// src/components/ProductList.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { getProducts } from './productService';
import { CartContext } from './CartContext';
import { useSearch } from './SearchContext'; // <-- Importamos el hook de búsqueda

const API_BASE_URL = 'http://localhost:4000';

const ImagePlaceholder = () => (
    <div className="product-list-item-image-placeholder">
        <span>Sin imagen</span>
    </div>
);

export default function ProductList() {
    const [allProducts, setAllProducts] = useState([]);
    const { addToCart } = useContext(CartContext);
    const { searchTerm } = useSearch(); // <-- Obtenemos el término de búsqueda global

    // Estados para los filtros y el ordenamiento
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [sortType, setSortType] = useState('default');
    // --- NUEVOS ESTADOS PARA FILTROS ---
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const categories = {
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
            try {
                const fetchedProducts = await getProducts();
                setAllProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
            } catch (err) {
                setError(`Error al cargar productos: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        loadProducts();
    }, []);

    const handlePriceChange = (e) => {
        setPriceRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = [...allProducts];

        // 1. Filtrar por término de búsqueda (del header)
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Filtrar por categoría
        if (selectedCategory !== 'Todas' && categories[selectedCategory]) {
            const { start, end } = categories[selectedCategory];
            filtered = filtered.filter(p => p.id >= start && p.id <= end);
        }

        // 3. Filtrar por rango de precio
        if (priceRange.min) {
            filtered = filtered.filter(p => p.precio >= parseFloat(priceRange.min));
        }
        if (priceRange.max) {
            filtered = filtered.filter(p => p.precio <= parseFloat(priceRange.max));
        }
        
        // 4. Ordenar
        switch (sortType) {
            case 'price-asc': filtered.sort((a, b) => a.precio - b.precio); break;
            case 'price-desc': filtered.sort((a, b) => b.precio - a.precio); break;
            case 'name-asc': filtered.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
            case 'name-desc': filtered.sort((a, b) => b.nombre.localeCompare(a.nombre)); break;
            default: break;
        }
        return filtered;
    }, [allProducts, searchTerm, selectedCategory, sortType, priceRange]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, sortType, productsPerPage, searchTerm, priceRange]);

    const indexOfLastProduct = currentPage * productsPerPage;
    const currentProductsOnPage = filteredAndSortedProducts.slice(indexOfLastProduct - productsPerPage, indexOfLastProduct);
    const totalPages = Math.ceil(filteredAndSortedProducts.length / productsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="product-page-container">
            <aside className="filters-sidebar">
                <h3>Filtros</h3>
                <div className="filter-group">
                    <label htmlFor="sort-select">Ordenar por:</label>
                    <select id="sort-select" value={sortType} onChange={(e) => setSortType(e.target.value)}>
                        <option value="default">Relevancia</option>
                        <option value="name-asc">Nombre (A-Z)</option>
                        <option value="name-desc">Nombre (Z-A)</option>
                        <option value="price-asc">Precio (Bajo a Alto)</option>
                        <option value="price-desc">Precio (Alto a Bajo)</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="category-select">Categoría:</label>
                    <select id="category-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                {/* --- NUEVO FILTRO DE PRECIO --- */}
                <div className="filter-group">
                    <label>Rango de Precio:</label>
                    <div className="price-range-inputs">
                         <input type="number" name="min" placeholder="Mín" value={priceRange.min} onChange={handlePriceChange} />
                         <input type="number" name="max" placeholder="Máx" value={priceRange.max} onChange={handlePriceChange} />
                    </div>
                </div>
            </aside>

            <main className="products-content">
                {isLoading ? ( <div className="loading-message"><p>Cargando productos...</p></div> ) 
                : error ? ( <div className="error-message global-error"><p>{error}</p></div> ) 
                : currentProductsOnPage.length > 0 ? (
                    <>
                        <div className="products-list-view">
                            {currentProductsOnPage.map(product => (
                                <div className="product-list-item" key={product.id}>
                                    <div className="product-list-item-image">
                                        {product.image_url ? (
                                            <img src={`${API_BASE_URL}${product.image_url}`} alt={product.nombre} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}/>
                                        ) : ( <ImagePlaceholder /> )}
                                    </div>
                                    <div className="product-list-item-details">
                                        <strong className="product-list-item-name">{product.nombre}</strong>
                                        <span className="product-code"> Cod.{product.id}</span>
                                    </div>
                                    <div className="product-list-item-actions">
                                        <span className="product-list-item-price">${product.precio.toLocaleString('es-AR')}</span>
                                        <button onClick={() => addToCart(product)} className="add-to-cart-button">
                                            Agregar al carrito
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && (
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
                            </div>
                        )}
                    </>
                ) : (
                    <div className="no-products-message"><p>No se encontraron productos con los filtros seleccionados.</p></div>
                )}
            </main>
        </div>
    );
}
