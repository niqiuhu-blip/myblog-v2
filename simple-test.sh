#!/bin/bash
# 简单的 API 测试脚本

API_BASE="http://localhost:4000/api"
COOKIE_FILE="/tmp/simple-test-cookies.txt"

echo "=========================================="
echo "  后端 API 简单测试"
echo "=========================================="
echo ""

rm -f "$COOKIE_FILE"

# 1. 健康检查
echo "1. 健康检查"
curl -s "$API_BASE/../healthz"
echo ""
curl -s "$API_BASE/health"
echo ""
curl -s "$API_BASE/ready"
echo ""
echo ""

# 2. 获取 CSRF Token 并登录
echo "2. 认证测试"
CSRF_TOKEN=$(curl -c "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: $CSRF_TOKEN"

echo "登录..."
curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: $CSRF_TOKEN" \
    -d '{"username":"admin","password":"admin123"}'
echo ""
echo ""

# 3. 获取当前用户
echo "3. 获取当前用户"
curl -b "$COOKIE_FILE" -s "$API_BASE/auth/me"
echo ""
echo ""

# 4. 获取分类列表
echo "4. 获取分类列表"
curl -s "$API_BASE/categories"
echo ""
echo ""

# 5. 获取标签列表
echo "5. 获取标签列表"
curl -s "$API_BASE/tags"
echo ""
echo ""

# 6. 获取文章列表
echo "6. 获取文章列表"
curl -s "$API_BASE/posts?page=1&limit=10"
echo ""
echo ""

echo "=========================================="
echo "  测试完成"
echo "=========================================="

rm -f "$COOKIE_FILE"
