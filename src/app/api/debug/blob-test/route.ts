import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export async function GET() {
    if (!BLOB_TOKEN) {
        return NextResponse.json({
            success: false,
            error: 'BLOB_READ_WRITE_TOKEN 未配置',
            tokenConfigured: false
        }, { status: 400 });
    }

    try {
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Blob Store 连接测试'
        };

        // 测试写入
        const blob = await put('debug/test-data.json', JSON.stringify(testData), {
            access: 'public',
            addRandomSuffix: false,
            token: BLOB_TOKEN,
            contentType: 'application/json',
        });

        // 测试读取
        const { blobs } = await list({ token: BLOB_TOKEN });
        const testBlob = blobs.find(b => b.pathname === 'debug/test-data.json');

        // 测试读取注册数据
        const { blobs: userBlobs } = await list({
            token: BLOB_TOKEN,
            prefix: 'users/'
        });
        const registrationBlob = userBlobs.find(b => b.pathname === 'users/registrations.json');

        return NextResponse.json({
            success: true,
            tokenConfigured: true,
            writeResult: {
                pathname: blob.pathname,
                url: blob.url,
                uploaded: true
            },
            readResult: {
                found: !!testBlob,
                blobCount: blobs.length,
                testBlob: testBlob ? {
                    pathname: testBlob.pathname,
                    size: testBlob.size,
                    uploadedAt: testBlob.uploadedAt
                } : null
            },
            registrationData: {
                found: !!registrationBlob,
                userBlobCount: userBlobs.length,
                registrationBlob: registrationBlob ? {
                    pathname: registrationBlob.pathname,
                    size: registrationBlob.size,
                    uploadedAt: registrationBlob.uploadedAt
                } : null
            },
            testData: testData
        });

    } catch (error) {
        console.error('Blob测试错误:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误',
            tokenConfigured: true,
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
