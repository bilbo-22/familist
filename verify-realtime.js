import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const SOCKET_URL = 'http://localhost:3000';

const clientA = io(SOCKET_URL);
const clientB = io(SOCKET_URL);

const testList = {
    id: uuidv4(),
    name: 'Test List',
    createdAt: Date.now()
};

const testItem = {
    id: uuidv4(),
    listId: testList.id,
    text: 'Test Item',
    completed: false,
    createdAt: Date.now()
};

let passed = true;

const runTest = async () => {
    console.log('Starting Real-time Verification...');

    // Wait for connections
    await new Promise(resolve => {
        let connected = 0;
        const check = () => {
            connected++;
            if (connected === 2) resolve();
        };
        clientA.on('connect', check);
        clientB.on('connect', check);
    });
    console.log('Clients connected.');

    // Test List Creation
    const listCreatedPromise = new Promise(resolve => {
        clientB.on('list:created', (list) => {
            if (list.id === testList.id) {
                console.log('PASS: Client B received list:created');
                resolve();
            }
        });
    });

    // Simulate Client A creating a list (via API simulation or just emitting if server allowed, but server expects API calls usually. 
    // However, for this test, let's use fetch to hit the API which triggers the socket event)
    await fetch(`${SOCKET_URL}/api/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testList)
    });

    await listCreatedPromise;

    // Test Item Addition
    const itemAddedPromise = new Promise(resolve => {
        clientB.on('item:added', (item) => {
            if (item.id === testItem.id) {
                console.log('PASS: Client B received item:added');
                resolve();
            }
        });
    });

    await fetch(`${SOCKET_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testItem)
    });

    await itemAddedPromise;

    // Test Item Update
    const itemUpdatedPromise = new Promise(resolve => {
        clientB.on('item:updated', (item) => {
            if (item.id === testItem.id && item.completed === true) {
                console.log('PASS: Client B received item:updated');
                resolve();
            }
        });
    });

    await fetch(`${SOCKET_URL}/api/items/${testItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
    });

    await itemUpdatedPromise;

    // Cleanup
    await fetch(`${SOCKET_URL}/api/lists/${testList.id}`, { method: 'DELETE' });

    clientA.disconnect();
    clientB.disconnect();
    console.log('All tests passed!');
    process.exit(0);
};

runTest().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
