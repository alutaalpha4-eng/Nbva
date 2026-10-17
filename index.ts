// SMS alerts are switched off. This function does nothing and never contacts an SMS provider,
// even if SMS secrets are added to the project.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return new Response(JSON.stringify({ configured: false, disabled: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
