import { NextResponse } from 'next/server';

// SSE endpoint for real-time updates
export async function GET() {
    const { getState } = await import('@/lib/store');

    const stream = new ReadableStream({
        start(controller) {
            const send = () => {
                try {
                    const data = JSON.stringify(getState());
                    controller.enqueue(`data: ${data}\n\n`);
                } catch {
                    controller.close();
                }
            };

            // Send immediately
            send();

            // Send every 1.5 seconds
            const interval = setInterval(send, 1500);

            // Clean up after 5 minutes
            const timeout = setTimeout(() => {
                clearInterval(interval);
                controller.close();
            }, 5 * 60 * 1000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
