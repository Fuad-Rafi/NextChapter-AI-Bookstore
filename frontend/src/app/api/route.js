import { forwardRequest } from './_proxy';

export const runtime = 'nodejs';

export async function GET(request) {
  return forwardRequest(request, []);
}

export async function POST(request) {
  return forwardRequest(request, []);
}

export async function PUT(request) {
  return forwardRequest(request, []);
}

export async function PATCH(request) {
  return forwardRequest(request, []);
}

export async function DELETE(request) {
  return forwardRequest(request, []);
}

export async function OPTIONS(request) {
  return forwardRequest(request, []);
}
