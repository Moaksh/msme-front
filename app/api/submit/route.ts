import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json(); // Parse the JSON body
        const response = await fetch('https://msme-flask-production.up.railway.app/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Error forwarding request to Flask:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
