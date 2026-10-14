const { test } = require('@playwright/test');

// This is the exercise, not a passing solution. Remove .skip when implementing it.
test.skip('microlección: pendiente reserva fondos sin acreditar al receptor', async () => {
  // 1. Create an isolated stable practice and sign in as Ana (fictitious user).
  // 2. Confirm her daily account starts with $2,500 and no reservation.
  // 3. Quote $100 to Bruno, check $101 including the fee, then confirm.
  // 4. Assert Pending, balance $2,500, reserved $101, available $2,399.
  // 5. In a separate Bruno session, assert his balance remains $1,200.
  // 6. Close Bruno's context and delete only this test's practice in finally.
  // See the lesson for API setup and the downloadable reference solution.
});
