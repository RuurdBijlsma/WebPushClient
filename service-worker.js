init();

async function init() {
    console.log("Initializing push server");

    self.addEventListener('push', e => {
        let data = e.data.json();

        const options = {
            body: data.Message,
            icon: data.Icon
        };

        e.waitUntil(notify(data.Title, options));
    });
}

async function notify(message, options) {
    console.log("notifying");
    await self.registration.showNotification(message, options);
}