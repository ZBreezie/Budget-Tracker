// idb setup

// create variable to hold db connection
// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
let db;
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
// save a reference to the database
// create an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful
// when db is successfully created with its object store or simply established a connection, save reference to db in global variable
// check if app is online, if yes run uploadTransaction() function to send all local db data to api
request.onsuccess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
// open a new transaction with the database with read and write permissions
// access the object store for `new_transaction`
// add record to your store with add method
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const trackerObjectStore = transaction.objectStore('new_transaction');
    trackerObjectStore.add(record);
}

function uploadTransaction() {

    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access your object store
    const trackerObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set to a variable
    const getAll = trackerObjectStore.getAll();

    getAll.onsuccess = function () {

        // if there was data in indexedDb's store send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    // open one more transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite');

                    // access the new_transaction object store
                    const trackerObjectStore = transaction.objectStore('new_transaction');

                    // clear all items in your store
                    trackerObjectStore.clear();

                    alert('All saved transactions has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);