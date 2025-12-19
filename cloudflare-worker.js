/**
 * Cloudflare Worker - Bangumi API 代理（浏览器语义版）
 */

addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
    const url = new URL(request.url);
  
    // 仅代理 Bangumi API
    if (url.pathname.startsWith("/v0/") || url.pathname === "/calendar") {
  
      // OPTIONS 预检
      if (request.method === "OPTIONS") {
        return handleCORS();
      }
  
      const apiUrl = "https://api.bgm.tv" + url.pathname + url.search;
  
      // 构造请求头（Worker 内设置 UA + 保留 Authorization）
      const headers = new Headers();
      headers.set("Accept", "application/json");
  
      // 保留前端带的 Authorization
      const auth = request.headers.get("Authorization");
      if (auth) headers.set("Authorization", auth);
  
      // ✅ 核心：模拟浏览器 UA
      headers.set(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/122.0.0.0 Safari/537.36"
      );
  
      const apiRequest = new Request(apiUrl, {
        method: request.method,
        headers,
        body: request.method !== "GET" && request.method !== "HEAD"
          ? request.body
          : null,
        cf: {
          cacheTtl: 0,
          cacheEverything: false,
          polish: "off",
          mirage: false,
          minify: { html: false, css: false, js: false }
        }
      });
  
      try {
        const response = await fetch(apiRequest);
  
        const newResponse = new Response(response.body, response);
  
        // CORS
        newResponse.headers.set("Access-Control-Allow-Origin", "*");
        newResponse.headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS"
        );
        newResponse.headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization"
        );
        newResponse.headers.set("Access-Control-Max-Age", "86400");
  
        // 禁缓存
        newResponse.headers.set(
          "Cache-Control",
          "no-cache, no-store, must-revalidate"
        );
        newResponse.headers.set("Pragma", "no-cache");
        newResponse.headers.set("Expires", "0");
  
        return newResponse;
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "API request failed", message: err.message }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }
  
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  
  // CORS 预检
  function handleCORS() {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  