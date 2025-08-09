import React, { useState } from 'react';
import { createTransformation } from './transformationService';
import { searchProducts } from './productService';
import AsyncSelect from 'react-select/async';
import { FaPlus, FaTrash } from 'react-icons/fa';

const Transformation = () => {
    // Estado para las listas de productos de entrada y salida
    const [inputs, setInputs] = useState([{ productOption: null, quantity: '' }]);
    const [outputs, setOutputs] = useState([{ productOption: null, quantity: '' }]);
    const [notes, setNotes] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Función para buscar productos en el AsyncSelect
    const loadProductOptions = (inputValue, callback) => {
        if (inputValue.length < 2) return callback([]);
        setTimeout(async () => {
            const options = await searchProducts(inputValue);
            callback(options);
        }, 400);
    };

    // Función genérica para manejar cambios en las filas (tanto de entrada como de salida)
    const handleRowChange = (index, field, value, type) => {
        const list = type === 'input' ? [...inputs] : [...outputs];
        if(field === 'quantity') {
            list[index][field] = value.replace(',', '.');
        } else {
            list[index][field] = value;
        }
        
        if (type === 'input') setInputs(list);
        else setOutputs(list);
    };

    // Función para añadir una nueva fila vacía
    const addRow = (type) => {
        const newItem = { productOption: null, quantity: '' };
        if (type === 'input') setInputs([...inputs, newItem]);
        else setOutputs([...outputs, newItem]);
    };

    // Función para eliminar una fila
    const removeRow = (index, type) => {
        if (type === 'input' && inputs.length > 1) {
            setInputs(inputs.filter((_, i) => i !== index));
        }
        if (type === 'output' && outputs.length > 1) {
            setOutputs(outputs.filter((_, i) => i !== index));
        }
    };

    // Función para enviar la transformación al backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        // Preparamos los datos para enviar
        const payload = {
            notes,
            inputs: inputs.filter(item => item.productOption).map(item => ({
                productId: item.productOption.value,
                quantity: parseFloat(item.quantity)
            })),
            outputs: outputs.filter(item => item.productOption).map(item => ({
                productId: item.productOption.value,
                quantity: parseFloat(item.quantity)
            }))
        };

        if (payload.inputs.length === 0 || payload.outputs.length === 0) {
            setError('Debe haber al menos un producto de entrada y uno de salida.');
            setIsLoading(false);
            return;
        }

        try {
            const result = await createTransformation(payload);
            setSuccess(result.message);
            // Reiniciamos el formulario
            setInputs([{ productOption: null, quantity: '' }]);
            setOutputs([{ productOption: null, quantity: '' }]);
            setNotes('');
        } catch (err) {
            setError(err.response?.data?.message || 'Ocurrió un error al procesar la transformación.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderRows = (type) => {
        const list = type === 'input' ? inputs : outputs;
        return list.map((item, index) => (
            <div key={index} className="sale-item-row">
                <AsyncSelect
                    className="product-search-select"
                    cacheOptions
                    loadOptions={loadProductOptions}
                    placeholder="Buscar producto..."
                    onChange={(option) => handleRowChange(index, 'productOption', option, type)}
                    value={item.productOption}
                    isClearable
                />
                <input
                    type="text"
                    placeholder="Cantidad"
                    value={item.quantity}
                    onChange={(e) => handleRowChange(index, 'quantity', e.target.value, type)}
                    className="quantity-input"
                    required
                />
                <button type="button" onClick={() => removeRow(index, type)} className="remove-item-button">
                    <FaTrash />
                </button>
            </div>
        ));
    };

    return (
        <div className="admin-section">
            <h2>Registrar Transformación de Productos</h2>
            <p className="admin-instructions">
                Utilice este módulo para registrar la conversión de materia prima en producto terminado. 
                Los productos de entrada serán **descontados** del stock, y los de salida serán **añadidos**.
            </p>

            {error && <p className="error-message global-error">{error}</p>}
            {success && <p className="success-message global-success">{success}</p>}

            <form onSubmit={handleSubmit}>
                <div className="transformation-columns">
                    <div className="transformation-column">
                        <h4>Materia Prima / Entradas</h4>
                        {renderRows('input')}
                        <button type="button" onClick={() => addRow('input')} className="add-item-button">
                            <FaPlus /> Añadir Entrada
                        </button>
                    </div>
                    <div className="transformation-column">
                        <h4>Producto Terminado / Salidas</h4>
                        {renderRows('output')}
                        <button type="button" onClick={() => addRow('output')} className="add-item-button">
                            <FaPlus /> Añadir Salida
                        </button>
                    </div>
                </div>

                <div className="admin-form" style={{marginTop: '20px'}}>
                    <textarea 
                        name="notes" 
                        placeholder="Notas sobre la transformación (opcional)..." 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)}
                        rows="3"
                    ></textarea>
                </div>

                <button type="submit" disabled={isLoading} className="admin-button-primary submit-sale-button">
                    {isLoading ? 'Procesando...' : 'Procesar Transformación'}
                </button>
            </form>
        </div>
    );
};

export default Transformation;