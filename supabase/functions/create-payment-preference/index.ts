import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { orderId, items, payer } = await req.json()

        const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
        if (!accessToken) {
            throw new Error('MP_ACCESS_TOKEN not set')
        }

        // Get the origin from the request
        const requestOrigin = req.headers.get('origin') || '';

        // Mercado Pago does not accept localhost in back_urls.
        // If we are on localhost, we use a placeholder (e.g., google.com) for testing.
        // In production (Vercel), requestOrigin will be the valid domain.
        const origin = requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')
            ? 'https://google.com'
            : requestOrigin;

        const preferenceData = {
            items: items.map((item: any) => ({
                title: item.title,
                quantity: Number(item.quantity),
                currency_id: 'BRL',
                unit_price: Number(item.unit_price),
            })),
            payer: {
                email: payer.email,
                name: payer.name,
            },
            external_reference: orderId,
            back_urls: {
                success: `${origin}/admin/orders?status=success`,
                failure: `${origin}/admin/orders?status=failure`,
                pending: `${origin}/admin/orders?status=pending`,
            },
            auto_return: 'approved',
        }

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(preferenceData)
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Mercado Pago Error:', data)
            throw new Error(data.message || 'Failed to create preference')
        }

        return new Response(
            JSON.stringify({ init_point: data.init_point, id: data.id, success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        console.error('Error processing payment:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
                stack: error.stack,
                details: 'Error inside Edge Function'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Return 200 to avoid FunctionsHttpError masking the body
            },
        )
    }
})
