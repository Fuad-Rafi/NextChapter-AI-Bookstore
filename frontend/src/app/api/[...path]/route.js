import { forwardRequest } from '../_proxy';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  return forwardRequest(request, params?.path || []);
}

export async function POST(request, { params }) {
  return forwardRequest(request, params?.path || []);
}

export async function PUT(request, { params }) {
  return forwardRequest(request, params?.path || []);
}

export async function PATCH(request, { params }) {
  return forwardRequest(request, params?.path || []);
}

export async function DELETE(request, { params }) {
  return forwardRequest(request, params?.path || []);
}

export async function OPTIONS(request, { params }) {
  return forwardRequest(request, params?.path || []);
}
