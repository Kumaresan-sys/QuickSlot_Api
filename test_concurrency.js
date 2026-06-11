async function runConcurrencyTest() {
  const baseUrl = "http://localhost:5001";
  const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  console.log("🚀 Starting Live Double-Booking Concurrency Test...\n");

  // 1. Setup: Register two unique "judges"
  const email1 = `judge1_${Date.now()}@test.com`;
  const email2 = `judge2_${Date.now()}@test.com`;

  console.log(`[Setup] Registering ${email1}...`);
  await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Judge One", email: email1, password: "password123" })
  });

  console.log(`[Setup] Registering ${email2}...`);
  await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Judge Two", email: email2, password: "password123" })
  });

  // 2. Login both to get tokens
  const login1 = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email1, password: "password123" })
  }).then(r => r.json());

  const login2 = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email2, password: "password123" })
  }).then(r => r.json());

  const token1 = login1.data.accessToken;
  const token2 = login2.data.accessToken;

  // 3. Get a Venue and a Slot to target
  const venues = await fetch(`${baseUrl}/venues`, {
    headers: { "Authorization": `Bearer ${token1}` }
  }).then(r => r.json());
  
  const targetVenueId = venues.data[0].id;

  const slots = await fetch(`${baseUrl}/venues/${targetVenueId}/slots?date=${date}`, {
    headers: { "Authorization": `Bearer ${token1}` }
  }).then(r => r.json());

  const availableSlot = slots.data.find((slot) => slot.status === "AVAILABLE");
  if (!availableSlot) {
    throw new Error(`No available slots found for ${date}`);
  }

  const targetSlotId = availableSlot.slot_id;
  const targetTime = availableSlot.slot_time;

  console.log(`\n🎯 TARGET ACQUIRED: Venue: ${venues.data[0].name} | Time: ${targetTime}`);
  console.log(`📱 Phone 1 (Judge 1) is ready.`);
  console.log(`📱 Phone 2 (Judge 2) is ready.`);

  console.log("\n⚡ FIRE! Both phones hit the 'Book' button at the exact same millisecond...\n");

  const bookingPayload = JSON.stringify({
    venueId: targetVenueId,
    slotId: targetSlotId,
    bookingDate: date
  });

  // 4. FIRE SIMULTANEOUS REQUESTS
  const request1 = fetch(`${baseUrl}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token1}` },
    body: bookingPayload
  });

  const request2 = fetch(`${baseUrl}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token2}` },
    body: bookingPayload
  });

  // Wait for both to finish
  const [response1, response2] = await Promise.all([request1, request2]);
  
  const data1 = await response1.json();
  const data2 = await response2.json();

  console.log(`[Phone 1 Response] HTTP ${response1.status}: ${JSON.stringify(data1)}`);
  console.log(`[Phone 2 Response] HTTP ${response2.status}: ${JSON.stringify(data2)}`);

  console.log("\n🧪 ANALYSIS:");
  if (response1.status === 201 && response2.status === 409) {
    console.log("✅ SUCCESS! Phone 1 won the race. Phone 2 was securely blocked by the database.");
  } else if (response2.status === 201 && response1.status === 409) {
    console.log("✅ SUCCESS! Phone 2 won the race. Phone 1 was securely blocked by the database.");
  } else {
    console.error("❌ FAILURE! Concurrency issue detected. Did both succeed? Or both fail?");
  }
}

runConcurrencyTest();
