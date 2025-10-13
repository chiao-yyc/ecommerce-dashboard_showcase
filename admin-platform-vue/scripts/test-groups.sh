#!/bin/bash

# 測試分組執行腳本
# Phase 1 Week 3: 目錄結構重組後的測試執行管理

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數定義
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 測試組別定義
run_unit_tests() {
    print_header "Running Unit Tests"
    echo "執行單元測試 (預期執行時間: < 3分鐘)"
    
    if npm run test tests/unit -- --run --reporter=default; then
        print_success "Unit tests completed successfully"
        return 0
    else
        print_error "Unit tests failed"
        return 1
    fi
}

run_integration_tests() {
    print_header "Running Integration Tests"
    echo "執行整合測試 (預期執行時間: < 5分鐘)"
    
    if npm run test tests/integration -- --run --reporter=default; then
        print_success "Integration tests completed successfully"
        return 0
    else
        print_error "Integration tests failed"
        return 1
    fi
}

run_e2e_tests() {
    print_header "Running E2E Tests"
    echo "執行端到端測試 (預期執行時間: < 15分鐘)"
    
    if npm run test tests/e2e -- --run --reporter=default; then
        print_success "E2E tests completed successfully"
        return 0
    else
        print_error "E2E tests failed"
        return 1
    fi
}

run_performance_tests() {
    print_header "Running Performance Tests"
    echo "執行效能測試"
    
    if npm run test tests/performance -- --run --reporter=default; then
        print_success "Performance tests completed successfully"
        return 0
    else
        print_error "Performance tests failed"
        return 1
    fi
}

run_quick_tests() {
    print_header "Running Quick Test Suite"
    echo "執行快速測試套件 (單元測試 + 關鍵整合測試)"
    
    # 執行核心單元測試
    if npm run test "tests/unit/composables/useAuth.test.ts" "tests/unit/composables/useOrder.test.ts" -- --run --reporter=default; then
        print_success "Quick unit tests passed"
    else
        print_error "Quick unit tests failed"
        return 1
    fi
    
    # 執行關鍵整合測試
    if npm run test tests/integration/workflows -- --run --reporter=default; then
        print_success "Quick integration tests passed"
    else
        print_error "Quick integration tests failed"
        return 1
    fi
    
    print_success "Quick test suite completed successfully"
}

run_full_suite() {
    print_header "Running Full Test Suite"
    echo "執行完整測試套件"
    
    local failed=0
    
    run_unit_tests || failed=1
    run_integration_tests || failed=1
    run_e2e_tests || failed=1
    
    if [ $failed -eq 0 ]; then
        print_success "All test suites passed! 🎉"
    else
        print_error "Some test suites failed"
        return 1
    fi
}

generate_coverage() {
    print_header "Generating Coverage Report"
    echo "生成測試覆蓋率報告"
    
    if npm run test:coverage; then
        print_success "Coverage report generated successfully"
        echo "查看報告: open coverage/index.html"
    else
        print_error "Coverage report generation failed"
        return 1
    fi
}

# 主要命令處理
case "${1:-help}" in
    "unit")
        run_unit_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "e2e")
        run_e2e_tests
        ;;
    "performance")
        run_performance_tests
        ;;
    "quick")
        run_quick_tests
        ;;
    "full")
        run_full_suite
        ;;
    "coverage")
        generate_coverage
        ;;
    "help"|*)
        echo "測試執行腳本 - Phase 1 Week 3 目錄重組版本"
        echo ""
        echo "使用方法: $0 [command]"
        echo ""
        echo "可用命令:"
        echo "  unit        執行單元測試 (< 3分鐘)"
        echo "  integration 執行整合測試 (< 5分鐘)"
        echo "  e2e         執行端到端測試 (< 15分鐘)"
        echo "  performance 執行效能測試"
        echo "  quick       執行快速測試套件 (< 2分鐘)"
        echo "  full        執行完整測試套件"
        echo "  coverage    生成覆蓋率報告"
        echo "  help        顯示此幫助訊息"
        echo ""
        echo "範例:"
        echo "  $0 unit                    # 只執行單元測試"
        echo "  $0 quick                   # 快速驗證"
        echo "  $0 full                    # 完整測試"
        echo "  $0 coverage                # 覆蓋率分析"
        ;;
esac