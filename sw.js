// sw.js - Service Worker para notificaciones en segundo plano
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Muestra la notificación nativa en el dispositivo o PC
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'MOSTRAR_NOTIFICACION') {
        const { titulo, cuerpo, esAlarma } = event.data;
        
        const opciones = {
            body: cuerpo,
            icon: '✨',
            badge: '✨',
            vibrate: esAlarma ? [500, 200, 500, 200, 500] : [200, 100, 200],
            requireInteraction: !!esAlarma // Si es alarma, la notificación se queda fija hasta que la toques
        };

        self.registration.showNotification(titulo, opciones);
    }
});