// src/components/productService.js
import productsData from '../data/productsData.json'; // Asegúrate de que esta ruta sea correcta

const LOCAL_STORAGE_KEY = 'distribuidoraMarcial_products';

// --- NUEVA FUNCIÓN PARA LIMPIAR EL NOMBRE DEL PRODUCTO ---
const cleanProductName = (name) => {
  if (!name) return ''; // Manejar casos donde el nombre es nulo o vacío
  // Elimina puntos, espacios y otros caracteres no deseados al final del string
  return name.replace(/[\s\.\-]+$/, '').trim();
};
// --- FIN NUEVA FUNCIÓN ---

// Función para obtener productos desde localStorage o el JSON
export const getProducts = () => {
  const storedProducts = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storedProducts) {
    let products = JSON.parse(storedProducts);
    // Mapeamos los productos cargados para asegurar que tengan 'nombre' y 'precio'
    // Y limpiamos el nombre aquí al cargarlos
    products = products.map(p => ({
      id: p.id,
      nombre: cleanProductName(p.nombre || p.name), // Aplica la limpieza aquí
      precio: p.precio || p.price,
      unidad: p.unidad || 'unidad'
    }));
    return products;
  }
  // Si no hay nada en localStorage, cargamos desde productsData.json
  // Y nos aseguramos de que productsData.json tenga 'nombre' y 'precio'
  return productsData.map(p => ({
    id: p.id,
    nombre: cleanProductName(p.nombre), // Aplica la limpieza aquí
    precio: p.precio,
    unidad: p.unidad || 'unidad'
  }));
};

// Función auxiliar para guardar productos en localStorage
const saveProducts = (products) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
};

export const addProduct = (product) => {
  const products = getProducts();
  // Asegurarse de que el nuevo producto tenga la estructura correcta y el nombre limpio
  const newProduct = {
    id: product.id,
    nombre: cleanProductName(product.nombre || product.name), // Limpia el nombre al añadir
    precio: Number(product.precio || product.price),
    unidad: product.unidad || 'unidad'
  };
  products.push(newProduct);
  saveProducts(products);
};

export const updateProduct = (updatedProduct) => {
  let products = getProducts();
  products = products.map((p) =>
    p.id === updatedProduct.id ? {
      id: updatedProduct.id,
      nombre: cleanProductName(updatedProduct.nombre || updatedProduct.name), // Limpia el nombre al actualizar
      precio: Number(updatedProduct.precio || updatedProduct.price),
      unidad: updatedProduct.unidad || 'unidad'
    } : p
  );
  saveProducts(products);
};

export const deleteProduct = (id) => {
  let products = getProducts();
  products = products.filter((p) => p.id !== id);
  saveProducts(products);
};