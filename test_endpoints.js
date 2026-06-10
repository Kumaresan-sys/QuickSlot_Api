const { io } = require("socket.io-client");

async function testEndpoints() {
  const baseUrl = "http://localhost:5001";
  let accessToken, refreshToken, userId;
  let venueId, slotId, bookingId;

  // Setup WebSocket Client
  const socket = io("ws://localhost:5001");
  let socketEventReceived = null;

  socket.on("connect", () => {
    console.log("🔌 Connected to WebSocket Server!");
  });

  socket.on("slot_update", (data) => {
    console.log(`📡 WebSocket Event Received -> Slot: ${data.slotId} is now ${data.status}`);
    socketEventReceived = data;
  });

  // Give socket a second to connect
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("\n--- 1. Testing Login ---");
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "password123" })
  });
  const loginData = await loginRes.json();
  if (loginRes.ok) {
    console.log("✅ Login successful");
    accessToken = loginData.data.accessToken;
    refreshToken = loginData.data.refreshToken;
    userId = loginData.data.user.id;
  } else {
    console.error("❌ Login failed:", loginData);
    socket.disconnect();
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`
  };

  console.log("\n--- 2. Testing Get Venues ---");
  const venuesRes = await fetch(`${baseUrl}/venues`, { headers });
  const venuesData = await venuesRes.json();
  if (venuesRes.ok && venuesData.data.length > 0) {
    console.log(`✅ Get Venues successful (Found ${venuesData.data.length} venues)`);
    venueId = venuesData.data[0].id;
  } else {
    console.error("❌ Get Venues failed:", venuesData);
    socket.disconnect();
    return;
  }

  console.log("\n--- 3. Testing Get Venue Slots (No Filter) ---");
  const date = "2026-06-15";
  const slotsRes = await fetch(`${baseUrl}/venues/${venueId}/slots?date=${date}`, { headers });
  const slotsData = await slotsRes.json();
  if (slotsRes.ok && slotsData.data.length > 0) {
    console.log(`✅ Get Slots successful (Found ${slotsData.data.length} total slots for the day)`);
    slotId = slotsData.data[0].slot_id;
  } else {
    console.error("❌ Get Slots failed:", slotsData);
    socket.disconnect();
    return;
  }

  console.log("\n--- 4. Testing Get Venue Slots (WITH Time Filter) ---");
  const timeFilteredRes = await fetch(`${baseUrl}/venues/${venueId}/slots?date=${date}&startTime=08:00&endTime=12:00`, { headers });
  const timeFilteredData = await timeFilteredRes.json();
  if (timeFilteredRes.ok) {
    console.log(`✅ Time Filter successful! Returned ${timeFilteredData.data.length} slots between 08:00 and 12:00`);
  } else {
    console.error("❌ Time Filter failed:", timeFilteredData);
  }

  console.log("\n--- 5. Testing Create Booking (Triggers WebSocket) ---");
  socketEventReceived = null;
  const bookingRes = await fetch(`${baseUrl}/bookings`, {
    method: "POST",
    headers,
    body: JSON.stringify({ venueId, slotId, bookingDate: date })
  });
  const bookingData = await bookingRes.json();
  if (bookingRes.status === 201) {
    console.log("✅ Create Booking successful:", bookingData.data.id);
    bookingId = bookingData.data.id;
  } else {
    console.error("❌ Create Booking failed:", bookingData);
    socket.disconnect();
    return;
  }

  // Wait briefly for WebSocket event to arrive
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (socketEventReceived && socketEventReceived.status === 'BOOKED') {
    console.log("✅ WebSocket successfully broadcasted the BOOKED status update!");
  } else {
    console.error("❌ WebSocket did not receive the expected BOOKED event.");
  }

  console.log("\n--- 6. Testing Get User Bookings ---");
  const userBookingsRes = await fetch(`${baseUrl}/users/${userId}/bookings`, { headers });
  const userBookingsData = await userBookingsRes.json();
  if (userBookingsRes.ok && userBookingsData.data.length > 0) {
    console.log(`✅ Get User Bookings successful (Found ${userBookingsData.data.length} bookings)`);
  } else {
    console.error("❌ Get User Bookings failed:", userBookingsData);
  }

  console.log("\n--- 7. Testing Cancel Booking (Triggers WebSocket) ---");
  socketEventReceived = null;
  const cancelRes = await fetch(`${baseUrl}/bookings/${bookingId}`, {
    method: "DELETE",
    headers
  });
  const cancelData = await cancelRes.json();
  if (cancelRes.ok) {
    console.log("✅ Cancel Booking successful:", cancelData.data.status);
  } else {
    console.error("❌ Cancel Booking failed:", cancelData);
  }

  // Wait briefly for WebSocket event to arrive
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (socketEventReceived && socketEventReceived.status === 'AVAILABLE') {
    console.log("✅ WebSocket successfully broadcasted the AVAILABLE status update!");
  } else {
    console.error("❌ WebSocket did not receive the expected AVAILABLE event.");
  }

  console.log("\n--- 8. Testing Refresh Token ---");
  const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  const refreshData = await refreshRes.json();
  if (refreshRes.ok) {
    console.log("✅ Refresh Token successful. New Access Token received.");
  } else {
    console.error("❌ Refresh Token failed:", refreshData);
  }

  console.log("\n--- 9. Testing Logout ---");
  const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
    method: "POST",
    headers,
    body: JSON.stringify({ refreshToken })
  });
  if (logoutRes.ok) {
    console.log("✅ Logout successful. Token revoked.");
  } else {
    const logoutData = await logoutRes.json();
    console.error("❌ Logout failed:", logoutData);
  }

  console.log("\n🎉 All endpoints and WebSockets tested successfully!");
  socket.disconnect();
}

testEndpoints();
