#!/bin/bash
# 清理测试数据

API_BASE="http://localhost:4000/api"
COOKIE_FILE="/tmp/cleanup-cookies.txt"

rm -f "$COOKIE_FILE"

# 登录
CSRF_TOKEN=$(curl -c "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: $CSRF_TOKEN" \
    -d '{"username":"admin","password":"admin123"}' > /dev/null

# 获取所有分类并删除
CATEGORY_IDS=$(curl -s "$API_BASE/categories" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
for ID in $CATEGORY_IDS; do
    echo "Deleting category: $ID"
    CSRF_TOKEN=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    curl -b "$COOKIE_FILE" -s -X DELETE "$API_BASE/categories/$ID" -H "x-csrf-token: $CSRF_TOKEN"
done

# 获取所有标签并删除
TAG_IDS=$(curl -s "$API_BASE/tags" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
for ID in $TAG_IDS; do
    echo "Deleting tag: $ID"
    CSRF_TOKEN=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    curl -b "$COOKIE_FILE" -s -X DELETE "$API_BASE/tags/$ID" -H "x-csrf-token: $CSRF_TOKEN"
done

rm -f "$COOKIE_FILE"
echo "Cleanup complete!"
