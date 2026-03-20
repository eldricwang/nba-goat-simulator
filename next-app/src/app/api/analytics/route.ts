import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体（来自 sendBeacon 的 Blob 数据）
    const body = await request.text();
    
    if (!body) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // 解析 JSON 数据
    const analyticsData = JSON.parse(body);
    
    // 简单记录到控制台（生产环境可以发送到外部服务）
    console.log('Analytics Event:', {
      timestamp: new Date().toISOString(),
      data: analyticsData,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for')
    });

    // 这里可以集成外部分析服务，比如：
    // - 发送到 Google Analytics 4
    // - 发送到 Plausible Analytics
    // - 发送到自建分析服务

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ success: true }, { status: 200 }); // 即使出错也返回成功，避免影响用户体验
  }
}

export async function OPTIONS(request: NextRequest) {
  // CORS 预检请求
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}