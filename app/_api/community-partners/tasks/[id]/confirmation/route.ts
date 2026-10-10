export const dynamic = 'force-static';

export function generateStaticParams() {
  return [];
}

export async function GET() {
  return new Response("ok");
}