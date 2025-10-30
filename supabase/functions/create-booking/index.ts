import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateBookingReference(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let reference = "BK";
  for (let i = 0; i < 8; i++) {
    reference += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return reference;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const {
      experience_id,
      slot_id,
      customer_name,
      customer_email,
      customer_phone,
      num_people,
      promo_code,
    } = body;

    if (!experience_id || !slot_id || !customer_name || !customer_email || !customer_phone || !num_people) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slot_id)
      .maybeSingle();

    if (slotError || !slot) {
      return new Response(
        JSON.stringify({ error: "Slot not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (slot.available_capacity < num_people) {
      return new Response(
        JSON.stringify({ error: "Not enough capacity available" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: experience, error: expError } = await supabase
      .from("experiences")
      .select("*")
      .eq("id", experience_id)
      .maybeSingle();

    if (expError || !experience) {
      return new Response(
        JSON.stringify({ error: "Experience not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let total_price = experience.price * num_people * slot.price_multiplier;
    let discount_amount = 0;

    if (promo_code) {
      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promo_code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (promo && !promoError) {
        const now = new Date();
        const validFrom = new Date(promo.valid_from);
        const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

        if (now >= validFrom && (!validUntil || now <= validUntil)) {
          if (!promo.usage_limit || promo.usage_count < promo.usage_limit) {
            if (total_price >= promo.min_amount) {
              if (promo.discount_type === "percentage") {
                discount_amount = (total_price * promo.discount_value) / 100;
                if (promo.max_discount) {
                  discount_amount = Math.min(discount_amount, promo.max_discount);
                }
              } else {
                discount_amount = promo.discount_value;
              }
              total_price -= discount_amount;

              await supabase
                .from("promo_codes")
                .update({ usage_count: promo.usage_count + 1 })
                .eq("id", promo.id);
            }
          }
        }
      }
    }

    const booking_reference = generateBookingReference();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        experience_id,
        slot_id,
        customer_name,
        customer_email,
        customer_phone,
        num_people,
        total_price,
        promo_code: promo_code?.toUpperCase() || null,
        discount_amount,
        status: "confirmed",
        booking_reference,
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    const { error: updateError } = await supabase
      .from("slots")
      .update({
        available_capacity: slot.available_capacity - num_people,
        is_available: slot.available_capacity - num_people > 0,
      })
      .eq("id", slot_id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify(booking),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});