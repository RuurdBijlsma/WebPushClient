document.addEventListener('DOMContentLoaded', init, false);

const apiUrl = "http://localhost:5000";

async function init() {
    // await enableNotifications();
}

async function getSubscription(registration) {
    return await registration.pushManager.getSubscription();
}

async function getRegistration() {
    if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('service-worker.js');
        return await navigator.serviceWorker.ready;
    } else {
        console.log('no support for service workers')
    }
}

async function disableNotifications() {
    let registration = await getRegistration();
    let subscription = await getSubscription(registration);
    if (subscription)
        await unsubscribe(subscription);
    console.log("Succesfully unsubscribed");
}

async function enableNotifications() {
    if (await getNotificationPermission()) {
        let registration = await getRegistration();
        await registration.showNotification("hoi", {
            body: "doei",
            icon: "icon.png",
            vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500]
        });

        if (await getSubscription(registration)) {
            console.log("Client is already subscribed to push service");
            return false;
        }

        await subscribeToPushNotifications(registration);
        return true;
    } else {
        console.warn("Permission not granted or serviceworker not supported, cannot enable notifications");
    }
}

async function unsubscribe(subscription) {
    await fetch(apiUrl + '/api/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'content-type': 'application/json'
        }
    });
    await subscription.unsubscribe();
    console.log("Unsubscribed from push service")
}

async function subscribeToPushNotifications(registration) {
    let publicKey = await (await fetch(apiUrl + '/api/subscribe')).json();
    console.log("Received public key", publicKey);
    let options = {
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicKey)
    };

    let existingSubscription = await getSubscription(registration);
    if (existingSubscription) {
        console.log("Unsubscribing from current subscription");
        await unsubscribe(existingSubscription);
    }

    let pushSubscription = await registration.pushManager.subscribe(options);
    console.log('Sending back push subscription details', pushSubscription);
    await fetch(apiUrl + '/api/subscribe', {
        method: 'POST',
        body: JSON.stringify(pushSubscription),
        headers: {
            'content-type': 'application/json'
        }
    });
    console.log("Subscribed to push notifications");
    return pushSubscription;
}

async function getNotificationPermission() {
    if (Notification.permission === 'granted')
        return true;
    if (Notification.permission === 'denied')
        return false;
    return await Notification.requestPermission();
}

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}