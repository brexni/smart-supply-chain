#!/bin/bash

# API 性能测试脚本
# 使用方法: chmod +x test-api-performance.sh && ./test-api-performance.sh

echo "🚀 开始测试 API 性能..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试端点
BASE_URL="http://localhost:3000"

# 测试函数
test_endpoint() {
    local name=$1
    local url=$2
    
    echo -e "${YELLOW}测试: $name${NC}"
    
    # 使用 curl 测试响应时间
    local time=$(curl -o /dev/null -s -w '%{time_total}\n' "$url")
    local time_ms=$(echo "$time * 1000" | bc)
    
    echo -e "  响应时间: ${GREEN}${time_ms} ms${NC}"
    
    # 再次测试(应该使用缓存)
    local time2=$(curl -o /dev/null -s -w '%{time_total}\n' "$url")
    local time2_ms=$(echo "$time2 * 1000" | bc)
    
    echo -e "  第二次(缓存): ${GREEN}${time2_ms} ms${NC}"
    echo ""
}

# 检查服务是否运行
if ! curl -s "$BASE_URL" > /dev/null; then
    echo "❌ 服务未运行! 请先执行: pnpm dev"
    exit 1
fi

echo "✅ 服务正在运行"
echo ""

# 测试各个端点
test_endpoint "获取表格列表" "$BASE_URL/api/tables"
test_endpoint "获取仪表盘数据" "$BASE_URL/api/dashboard"

echo "✨ 测试完成!"
echo ""
echo "期望结果:"
echo "  - 首次请求: 100-300ms"
echo "  - 第二次请求: <100ms (使用缓存)"
echo ""
echo "如果响应时间过长,请检查:"
echo "  1. 数据库索引是否创建成功"
echo "  2. 数据库连接是否正常"
echo "  3. 网络延迟是否过高"
