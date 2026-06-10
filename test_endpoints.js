async function testEndpoints() {
  const baseUrl = "http://localhost:5001";
  let accessToken, refreshToken, userId;
  let venueId, slotId, bookingId;

  console.log("--- 1. Testing Login ---");
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
    return;
  }

  console.log("\n--- 3. Testing Get Venue Slots ---");
  const date = "2026-06-15";
  const slotsRes = await fetch(`${baseUrl}/venues/${venueId}/slots?date=${date}`, { headers });
  const slotsData = await slotsRes.json();
  if (slotsRes.ok && slotsData.data.length > 0) {
    console.log(`✅ Get Slots successful (Found ${slotsData.data.length} slots)`);
    slotId = slotsData.data[0].slot_id;
  } else {
    console.error("❌ Get Slots failed:", slotsData);
    return;
  }

  console.log("\n--- 4. Testing Create Booking ---");
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
    return;
  }

  console.log("\n--- 5. Testing Get User Bookings ---");
  const userBookingsRes = await fetch(`${baseUrl}/bookings/users/${userId}/bookings`, { headers });
  const userBookingsData = await userBookingsRes.json();
  if (userBookingsRes.ok && userBookingsData.data.length > 0) {
    console.log(`✅ Get User Bookings successful (Found ${userBookingsData.data.length} bookings)`);
  } else {
    console.error("❌ Get User Bookings failed:", userBookingsData);
  }

  console.log("\n--- 6. Testing Cancel Booking ---");
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

  console.log("\n--- 7. Testing Refresh Token ---");
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

  console.log("\n--- 8. Testing Logout ---");
  const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  if (logoutRes.ok) {
    console.log("✅ Logout successful. Token revoked.");
  } else {
    const logoutData = await logoutRes.json();
    console.error("❌ Logout failed:", logoutData);
  }

  console.log("\n🎉 All endpoints tested successfully!");
}

testEndpoints();
