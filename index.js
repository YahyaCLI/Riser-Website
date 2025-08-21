//SUPABASE
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://pvffpfxfepxkzgabtbsa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZmZwZnhmZXB4a3pnYWJ0YnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjkxNzgsImV4cCI6MjA2OTQ0NTE3OH0.if2n5dW1vd4VOcEugAk5tPhQ0mSm1NfF6BkU_SB_UB0'
const supabase = createClient(supabaseUrl, supabaseKey)

const input = document.getElementById("input");
const join = document.getElementById("join");
const header = document.getElementById("moto")
const passage = document.querySelector('.passage')
const oneLiner = document.getElementById("one-liner");

function waitForTurnstileReady(widgetId, callback) {
  const interval = setInterval(() => {
    try {
      const token = turnstile.getResponse(widgetId);
      if (token !== "") {
        clearInterval(interval);
        callback(token);
      }
    } catch (err) {
      // Widget not ready yet
    }
  }, 100);
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}


async function addToMailingList(email) {
  if (!validateEmail(email)) {
    showError("Invalid email format.");
    return;
  }

  // Wait until Turnstile widget is ready
  waitForTurnstileReady("cf-turnstile-widget", async (token) => {
    if (!token) {
      showError("Please complete the CAPTCHA.");
      return;
    }

    const referrer = document.referrer || "Direct";

    let location = null;
    try {
      const res = await fetch("https://ipapi.co/json");
      const locationData = await res.json();
      location = `${locationData.city}, ${locationData.country_name}`;
    } catch (err) {
      console.warn("Could not get location", err);
    }

    try {
      const response = await fetch("/functions/v1/join-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, referrer, location })
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Something went wrong.");
        return;
      }

      if (data.duplicate) {
        showError("This email is already signed up.");
        return;
      }

      // Success UI
      header.textContent = "You're on the WaitList! 🎉";
      passage.textContent =
        "Thanks for joining the waitlist for Riser. We're happy to welcome more users gradually.";
      input.style.display = 'none';
      join.style.display = 'none';
      oneLiner.style.display = 'none';
      input.value = "";
    } catch (err) {
      console.error("❌ Error calling Edge Function:", err);
      showError("Network error. Try again later.");
    }
  });
}
  // Handle button click
  join.addEventListener('click', () => {
    const email = input.value.trim();
    addToMailingList(email);
  });

  // Handle Enter key
  input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      const email = input.value.trim();
      addToMailingList(email);
    }
  });

  function showError(message) {
    const alertBox = document.getElementById("error-alert");
    alertBox.textContent =  message;
    alertBox.style.display = "block";

    setTimeout(() => {
      alertBox.style.display = "none";
    }, 4000);
  }
  