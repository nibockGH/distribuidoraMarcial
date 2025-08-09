// src/components/SearchContext.jsx
import React, { createContext, useState, useContext } from 'react';

// 1. Creamos el contexto
const SearchContext = createContext();

// 2. Creamos un "Hook" personalizado para usar el contexto más fácil
export const useSearch = () => useContext(SearchContext);

// 3. Creamos el Proveedor del contexto
export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
};
