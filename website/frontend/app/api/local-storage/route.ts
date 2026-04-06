import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const filename = formData.get('filename') as string;
        const bucket = formData.get('bucket') as string;

        if (!file || !filename || !bucket) {
            return NextResponse.json({ error: 'Missing file, filename, or bucket' }, { status: 400 });
        }

        const bucketPath = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(bucketPath)) {
            fs.mkdirSync(bucketPath, { recursive: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // For simplicity we just dump it all in 'uploads' instead of separating by bucket, or we can use bucket:
        const finalPath = path.join(bucketPath, filename);

        fs.writeFileSync(finalPath, buffer);

        return NextResponse.json({
            data: {
                path: filename,
                publicUrl: `/uploads/${filename}`
            },
            error: null
        });
    } catch (e: any) {
        console.error('Upload Error:', e);
        return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
    }
}
