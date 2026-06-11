const assert = require('assert');
const { io } = require('socket.io-client');

const baseUrl = 'http://localhost:5001';
const socketUrl = 'ws://localhost:5001';

function waitFor(socket, predicate, timeoutMs = 35_000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off('slot_update', onUpdate);
      reject(new Error('Timed out waiting for slot_update'));
    }, timeoutMs);

    function onUpdate(data) {
      if (!predicate(data)) return;
      clearTimeout(timeout);
      socket.off('slot_update', onUpdate);
      resolve(data);
    }

    socket.on('slot_update', onUpdate);
  });
}

async function login() {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
    }),
  });
  if (response.status !== 200) {
    throw new Error(
      `Login failed with HTTP ${response.status}: ${await response.text()}`
    );
  }
  return response.json();
}

async function getTargetSlot(accessToken) {
  const date = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const venues = await fetch(`${baseUrl}/venues`, { headers }).then(
    (response) => response.json()
  );
  const venueId = venues.data[0].id;
  const slots = await fetch(`${baseUrl}/venues/${venueId}/slots?date=${date}`, {
    headers,
  }).then((response) => response.json());
  const slot = slots.data.find((candidate) => candidate.status === 'AVAILABLE');
  assert.ok(slot, `No available slot found for ${date}`);
  return { venueId, slotId: slot.slot_id, date };
}

async function run() {
  console.log('🚦 Starting slot hold lifecycle test...');

  const loginData = await login();
  const userId = loginData.data.user.id;
  const { venueId, slotId, date } = await getTargetSlot(
    loginData.data.accessToken
  );
  const socket = io(socketUrl, { transports: ['websocket'] });

  await new Promise((resolve) => socket.on('connect', resolve));

  const heldPromise = waitFor(
    socket,
    (data) =>
      data.slotId === slotId && data.status === 'HELD' && data.userId === userId
  );
  socket.emit('slot_hold', { venueId, slotId, date, userId });
  const held = await heldPromise;
  console.log(`✅ Hold broadcast received: ${held.status}`);

  const releasedPromise = waitFor(
    socket,
    (data) => data.slotId === slotId && data.status === 'AVAILABLE'
  );
  socket.emit('slot_release', { venueId, slotId, date, userId });
  const released = await releasedPromise;
  console.log(`✅ Release broadcast received: ${released.status}`);

  const secondHoldPromise = waitFor(
    socket,
    (data) => data.slotId === slotId && data.status === 'HELD'
  );
  socket.emit('slot_hold', { venueId, slotId, date, userId });
  await secondHoldPromise;
  const expired = await waitFor(
    socket,
    (data) => data.slotId === slotId && data.status === 'AVAILABLE'
  );
  console.log(`✅ Expiry broadcast received: ${expired.status}`);

  const thirdHoldPromise = waitFor(
    socket,
    (data) => data.slotId === slotId && data.status === 'HELD'
  );
  socket.emit('slot_hold', { venueId, slotId, date, userId });
  await thirdHoldPromise;
  socket.disconnect();

  const watcher = io(socketUrl, { transports: ['websocket'] });
  await new Promise((resolve) => watcher.on('connect', resolve));
  socket.connect();
  await new Promise((resolve) => socket.on('connect', resolve));
  const watcherHoldPromise = waitFor(
    watcher,
    (data) => data.slotId === slotId && data.status === 'HELD'
  );
  socket.emit('slot_hold', { venueId, slotId, date, userId });
  await watcherHoldPromise;
  socket.disconnect();
  const disconnectRelease = await waitFor(
    watcher,
    (data) => data.slotId === slotId && data.status === 'AVAILABLE'
  );
  console.log(
    `✅ Disconnect release broadcast received: ${disconnectRelease.status}`
  );

  watcher.disconnect();
  console.log('🎉 Slot hold lifecycle test passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
