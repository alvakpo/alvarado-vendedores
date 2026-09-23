import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // Get event config
    const { data: config } = await supabaseAdmin
      .from("event_config")
      .select("*")
      .eq("id", 1)
      .single();

    // Get all active participants ordered by sort_order
    const { data: participants, error } = await supabaseAdmin
      .from("participants")
      .select("id, first_name, last_name, participant_type, photo_url, tickets_assigned, tickets_sold, sort_order, status")
      .eq("status", "active")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    // Calculate totals
    const totalAssigned = participants?.reduce((sum, p) => sum + p.tickets_assigned, 0) || 0;
    const totalSold = participants?.reduce((sum, p) => sum + p.tickets_sold, 0) || 0;
    const totalTickets = config?.total_tickets || 500;
    const ticketPrice = config?.ticket_price || 10000;

    return NextResponse.json({
      config: {
        name: config?.name || "Alvarado Vendedores",
        total_tickets: totalTickets,
        ticket_price: ticketPrice,
        status: config?.status || "open",
      },
      participants: participants || [],
      totals: {
        total: totalTickets,
        assigned: totalAssigned,
        unassigned: totalTickets - totalAssigned,
        sold: totalSold,
        in_hands: totalAssigned - totalSold,
        revenue: totalSold * ticketPrice,
        percentage: totalTickets > 0 ? Math.round((totalSold / totalTickets) * 100 * 100) / 100 : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching public data:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
