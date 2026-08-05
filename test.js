export async function onRequestGet() {
  return new Response("Test endpoint works! 🎉", {
    headers: { "Content-Type": "text/plain" }
  });
}