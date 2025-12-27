import { NextRequest, NextResponse } from "next/server";

import { externalAPI } from "@/lib/external-api";

// Proxy mínimo - Solo forwarding a API externa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);

    // Solo proxy - sin lógica de negocio
    const data = await externalAPI.get("/deposits", params);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error - GET /deposits:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Solo proxy - sin validaciones
    const data = await externalAPI.post("/deposits", body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Proxy error - POST /deposits:", error);
    return NextResponse.json(
      { error: "Failed to create deposit" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Solo proxy - sin lógica
    const data = await externalAPI.put("/deposits", body);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error - PUT /deposits:", error);
    return NextResponse.json(
      { error: "Failed to update deposit" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Solo proxy - sin lógica
    const data = await externalAPI.delete(`/deposits/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error - DELETE /deposits:", error);
    return NextResponse.json(
      { error: "Failed to delete deposit" },
      { status: 500 }
    );
  }
}
