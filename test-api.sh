#!/bin/bash
# API 测试脚本

set -e

API_BASE="http://localhost:4000/api"
COOKIE_FILE="/tmp/api-test-cookies.txt"

echo "=========================================="
echo "  后端 API 测试"
echo "=========================================="
echo ""

# 清理
rm -f "$COOKIE_FILE"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# 1. 健康检查
echo "1. 健康检查"
print_info "测试 /healthz"
if curl -s "$API_BASE/../healthz" | grep -q "OK"; then
    print_success "/healthz 正常"
else
    print_error "/healthz 失败"
    exit 1
fi

print_info "测试 /api/health"
if curl -s "$API_BASE/health" | grep -q "healthy"; then
    print_success "/api/health 正常"
else
    print_error "/api/health 失败"
fi

print_info "测试 /api/ready"
if curl -s "$API_BASE/ready" | grep -q "ready"; then
    print_success "/api/ready 正常"
else
    print_error "/api/ready 失败"
fi
echo ""

# 2. 认证模块测试
echo "2. 认证模块测试"

# 获取 CSRF Token
print_info "获取 CSRF Token"
CSRF_TOKEN=$(curl -c "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$CSRF_TOKEN" ]; then
    print_success "CSRF Token 获取成功"
else
    print_error "CSRF Token 获取失败"
    exit 1
fi

# 用户登录
print_info "用户登录 (admin/admin123)"
LOGIN_RESPONSE=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: $CSRF_TOKEN" \
    -d '{"username":"admin","password":"admin123"}')
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    print_success "登录成功"
else
    print_error "登录失败: $LOGIN_RESPONSE"
    exit 1
fi

# 获取当前用户信息
print_info "获取当前用户信息"
ME_RESPONSE=$(curl -b "$COOKIE_FILE" -s "$API_BASE/auth/me")
if echo "$ME_RESPONSE" | grep -q '"username":"admin"'; then
    print_success "获取用户信息成功"
else
    print_error "获取用户信息失败"
fi
echo ""

# 3. 分类模块测试
echo "3. 分类模块测试"

# 获取所有分类
print_info "获取所有分类"
CATEGORIES=$(curl -s "$API_BASE/categories")
if echo "$CATEGORIES" | grep -q '"success":true'; then
    print_success "获取分类列表成功"
else
    print_error "获取分类列表失败"
fi

# 创建分类（需要先获取新的 CSRF Token）
print_info "创建新分类"
CSRF_TOKEN2=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
CREATE_CAT=$(curl -b "$COOKIE_FILE" -s -X POST "$API_BASE/categories" \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: $CSRF_TOKEN2" \
    -d '{"name":"测试分类","slug":"test-category","description":"这是一个测试分类"}')
if echo "$CREATE_CAT" | grep -q '"success":true'; then
    CATEGORY_ID=$(echo "$CREATE_CAT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    print_success "创建分类成功 (ID: $CATEGORY_ID)"
else
    print_error "创建分类失败: $CREATE_CAT"
fi

# 根据 ID 获取分类
if [ -n "$CATEGORY_ID" ]; then
    print_info "根据 ID 获取分类"
    GET_CAT=$(curl -s "$API_BASE/categories/$CATEGORY_ID")
    if echo "$GET_CAT" | grep -q '"name":"测试分类"'; then
        print_success "根据 ID 获取分类成功"
    else
        print_error "根据 ID 获取分类失败"
    fi

    # 根据 Slug 获取分类
    print_info "根据 Slug 获取分类"
    GET_CAT_SLUG=$(curl -s "$API_BASE/categories/slug/test-category")
    if echo "$GET_CAT_SLUG" | grep -q '"slug":"test-category"'; then
        print_success "根据 Slug 获取分类成功"
    else
        print_error "根据 Slug 获取分类失败"
    fi

    # 更新分类
    print_info "更新分类"
    CSRF_TOKEN3=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    UPDATE_CAT=$(curl -b "$COOKIE_FILE" -s -X PUT "$API_BASE/categories/$CATEGORY_ID" \
        -H "Content-Type: application/json" \
        -H "x-csrf-token: $CSRF_TOKEN3" \
        -d '{"description":"这是一个更新后的测试分类"}')
    if echo "$UPDATE_CAT" | grep -q '"success":true'; then
        print_success "更新分类成功"
    else
        print_error "更新分类失败"
    fi
fi
echo ""

# 4. 标签模块测试
echo "4. 标签模块测试"

# 获取所有标签
print_info "获取所有标签"
TAGS=$(curl -s "$API_BASE/tags")
if echo "$TAGS" | grep -q '"success":true'; then
    print_success "获取标签列表成功"
else
    print_error "获取标签列表失败"
fi

# 创建标签
print_info "创建新标签"
CSRF_TOKEN4=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
CREATE_TAG=$(curl -b "$COOKIE_FILE" -s -X POST "$API_BASE/tags" \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: $CSRF_TOKEN4" \
    -d '{"name":"测试标签","slug":"test-tag"}')
if echo "$CREATE_TAG" | grep -q '"success":true'; then
    TAG_ID=$(echo "$CREATE_TAG" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    print_success "创建标签成功 (ID: $TAG_ID)"
else
    print_error "创建标签失败: $CREATE_TAG"
fi

# 根据 ID 获取标签
if [ -n "$TAG_ID" ]; then
    print_info "根据 ID 获取标签"
    GET_TAG=$(curl -s "$API_BASE/tags/$TAG_ID")
    if echo "$GET_TAG" | grep -q '"name":"测试标签"'; then
        print_success "根据 ID 获取标签成功"
    else
        print_error "根据 ID 获取标签失败"
    fi
fi
echo ""

# 5. 文章模块测试
echo "5. 文章模块测试"

# 获取所有文章
print_info "获取所有文章"
POSTS=$(curl -s "$API_BASE/posts?page=1&limit=10")
if echo "$POSTS" | grep -q '"success":true'; then
    print_success "获取文章列表成功"
else
    print_error "获取文章列表失败"
fi

# 创建文章
if [ -n "$CATEGORY_ID" ] && [ -n "$TAG_ID" ]; then
    print_info "创建新文章"
    CSRF_TOKEN5=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    CREATE_POST=$(curl -b "$COOKIE_FILE" -s -X POST "$API_BASE/posts" \
        -H "Content-Type: application/json" \
        -H "x-csrf-token: $CSRF_TOKEN5" \
        -d "{\"title\":\"测试文章\",\"slug\":\"test-post\",\"content\":\"这是测试文章内容\",\"excerpt\":\"测试摘要\",\"status\":\"PUBLISHED\",\"categoryIds\":[\"$CATEGORY_ID\"],\"tagIds\":[\"$TAG_ID\"]}")
    if echo "$CREATE_POST" | grep -q '"success":true'; then
        POST_ID=$(echo "$CREATE_POST" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_success "创建文章成功 (ID: $POST_ID)"
    else
        print_error "创建文章失败: $CREATE_POST"
    fi

    # 根据 ID 获取文章
    if [ -n "$POST_ID" ]; then
        print_info "根据 ID 获取文章"
        GET_POST=$(curl -s "$API_BASE/posts/$POST_ID")
        if echo "$GET_POST" | grep -q '"title":"测试文章"'; then
            print_success "根据 ID 获取文章成功"
        else
            print_error "根据 ID 获取文章失败"
        fi

        # 根据 Slug 获取文章
        print_info "根据 Slug 获取文章"
        GET_POST_SLUG=$(curl -s "$API_BASE/posts/slug/test-post")
        if echo "$GET_POST_SLUG" | grep -q '"slug":"test-post"'; then
            print_success "根据 Slug 获取文章成功"
        else
            print_error "根据 Slug 获取文章失败"
        fi

        # 搜索文章（在删除前测试）
        print_info "搜索文章"
        sleep 0.5
        SEARCH_POST=$(curl -s "$API_BASE/posts/search?q=测试&page=1&limit=10")
        if echo "$SEARCH_POST" | grep -q '"success":true'; then
            print_success "搜索文章成功"
        else
            print_error "搜索文章失败: $SEARCH_POST"
        fi

        # 更新文章
        print_info "更新文章"
        CSRF_TOKEN6=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
        UPDATE_POST=$(curl -b "$COOKIE_FILE" -s -X PUT "$API_BASE/posts/$POST_ID" \
            -H "Content-Type: application/json" \
            -H "x-csrf-token: $CSRF_TOKEN6" \
            -d '{"title":"测试文章 - 更新"}')
        if echo "$UPDATE_POST" | grep -q '"success":true'; then
            print_success "更新文章成功"
        else
            print_error "更新文章失败"
        fi

        # 删除文章
        print_info "删除文章"
        CSRF_TOKEN7=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
        DELETE_POST=$(curl -b "$COOKIE_FILE" -s -X DELETE "$API_BASE/posts/$POST_ID" \
            -H "x-csrf-token: $CSRF_TOKEN7")
        if echo "$DELETE_POST" | grep -q '"success":true'; then
            print_success "删除文章成功"
        else
            print_error "删除文章失败"
        fi
    fi
fi
echo ""

# 6. 清理测试数据
echo "6. 清理测试数据"

if [ -n "$TAG_ID" ]; then
    print_info "删除测试标签"
    CSRF_TOKEN8=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    DELETE_TAG=$(curl -b "$COOKIE_FILE" -s -X DELETE "$API_BASE/tags/$TAG_ID" \
        -H "x-csrf-token: $CSRF_TOKEN8")
    if echo "$DELETE_TAG" | grep -q '"success":true'; then
        print_success "删除标签成功"
    else
        print_error "删除标签失败"
    fi
fi

if [ -n "$CATEGORY_ID" ]; then
    print_info "删除测试分类"
    CSRF_TOKEN9=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    DELETE_CAT=$(curl -b "$COOKIE_FILE" -s -X DELETE "$API_BASE/categories/$CATEGORY_ID" \
        -H "x-csrf-token: $CSRF_TOKEN9")
    if echo "$DELETE_CAT" | grep -q '"success":true'; then
        print_success "删除分类成功"
    else
        print_error "删除分类失败"
    fi
fi
echo ""

# 用户登出
echo "7. 用户登出"
print_info "用户登出"
CSRF_TOKEN10=$(curl -c "$COOKIE_FILE" -b "$COOKIE_FILE" -s "$API_BASE/auth/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
LOGOUT_RESPONSE=$(curl -b "$COOKIE_FILE" -s -X POST "$API_BASE/auth/logout" \
    -H "x-csrf-token: $CSRF_TOKEN10")
if echo "$LOGOUT_RESPONSE" | grep -q '"success":true'; then
    print_success "登出成功"
else
    print_error "登出失败"
fi
echo ""

# 清理
rm -f "$COOKIE_FILE"

echo "=========================================="
echo -e "${GREEN}  所有测试完成！${NC}"
echo "=========================================="
