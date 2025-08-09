import React, { useState, useEffect } from 'react';
import { FaBell, FaExclamationTriangle, FaTimesCircle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import { getNotifications } from './notificationService';

const iconMap = {
    warning: <FaExclamationTriangle />,
    danger: <FaTimesCircle />,
    info: <FaInfoCircle />,
    success: <FaCheckCircle />
};

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch (error) {
                console.error("Error al cargar notificaciones:", error);
            }
        };
        fetchNotifications();
    }, []);

    return (
        <div className="notification-bell-container">
            <button onClick={() => setIsOpen(!isOpen)} className="notification-bell-button">
                <FaBell />
                {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h4>Notificaciones</h4>
                    </div>
                    {notifications.length > 0 ? (
                        <ul className="notification-list">
                            {notifications.map((notif, index) => (
                                <li key={index} className={`notification-item type-${notif.type}`}>
                                    <span className="notification-icon">{iconMap[notif.type]}</span>
                                    <p>{notif.message}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-notifications">No hay notificaciones nuevas.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;