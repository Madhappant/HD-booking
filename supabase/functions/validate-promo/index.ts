import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { code, amount } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, message: "Promo code is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (error || !promo) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid promo code" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

    if (now < validFrom) {
      return new Response(
        JSON.stringify({ valid: false, message: "Promo code not yet valid" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (validUntil && now > validUntil) {
      return new Response(
        JSON.stringify({ valid: false, message: "Promo code has expired" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return new Response(
        JSON.stringify({ valid: false, message: "Promo code usage limit reached" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (amount && amount < promo.min_amount) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: `Minimum purchase amount is $${promo.min_amount}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let discount = 0;
    if (amount) {
      if (promo.discount_type === "percentage") {
        discount = (amount * promo.discount_value) / 100;
        if (promo.max_discount) {
          discount = Math.min(discount, promo.max_discount);
        }
      } else {
        discount = promo.discount_value;
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        message: "Promo code applied successfully",
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: discount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false, message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});